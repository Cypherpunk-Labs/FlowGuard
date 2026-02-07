import * as vscode from 'vscode';
import { configurationManager } from './ConfigurationManager';
import { FlowGuardConfiguration } from './types';
import { setLogLevel } from '../../utils/logger';

interface WatcherHandler {
  (newValue: any, oldValue: any, changes?: { section: string; keys: string[] }): void | Promise<void>;
}

interface WatcherRegistration {
  section: string;
  pattern: string;
  handler: WatcherHandler;
  disposable: vscode.Disposable;
}

interface DebouncedWatcher {
  oldValue: FlowGuardConfiguration;
  newValue: FlowGuardConfiguration;
  handlers: WatcherRegistration[];
}

class ConfigurationWatcher {
  private static instance: ConfigurationWatcher | null = null;
  private watchers: Map<string, WatcherRegistration[]> = new Map();
  private disposables: vscode.Disposable[] = [];
  private configurationChangeSubscription: vscode.Disposable | null = null;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private debouncedWatchers: Map<string, DebouncedWatcher> = new Map();
  private debounceDelay: number = 100;

  private constructor() {}

  static getInstance(): ConfigurationWatcher {
    if (!ConfigurationWatcher.instance) {
      ConfigurationWatcher.instance = new ConfigurationWatcher();
    }
    return ConfigurationWatcher.instance;
  }

  initialize(): void {
    this.configurationChangeSubscription = vscode.workspace.onDidChangeConfiguration((event) => {
      this.handleConfigurationChange(event);
    });
    this.disposables.push(this.configurationChangeSubscription);
    this.setupBuiltInWatchers();
  }

  dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
    this.watchers.clear();
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    this.debouncedWatchers.clear();
  }

  private matchesPattern(pattern: string, changedSection: string, changedKeys: string[]): boolean {
    if (pattern === '*') {
      return true;
    }

    if (pattern.includes('.*')) {
      const sectionPattern = pattern.replace('.*', '');
      if (changedSection === sectionPattern) {
        return true;
      }
    }

    if (pattern.includes('.')) {
      const patternParts = pattern.split('.');
      const section = patternParts[0];
      const key = patternParts[1];
      if (section === changedSection && changedKeys.includes(key || '')) {
        return true;
      }
    }

    if (pattern === changedSection) {
      return true;
    }

    return false;
  }

  private handleConfigurationChange(event: vscode.ConfigurationChangeEvent): void {
    const allSections = ['llm', 'templates', 'editor', 'codebase', 'verification', 'telemetry', 'general'];
    const allKeys: Record<string, string[]> = {
      llm: ['provider', 'model', 'baseUrl', 'temperature', 'maxTokens', 'timeout', 'retryAttempts', 'streamResponses'],
      templates: ['defaultAgent', 'customPath', 'includeCodebaseContext', 'maxCodebaseFiles'],
      editor: ['autoSave', 'autoSaveDelay', 'enableDiagramPreview'],
      codebase: ['maxFilesToScan', 'excludePatterns', 'includePatterns', 'enableIncrementalScan'],
      verification: ['autoVerifyOnSave', 'minimumSeverity', 'enableAutoFix'],
      telemetry: ['enabled', 'includeErrorReports'],
      general: ['logLevel', 'showWelcomeOnStartup']
    };

    for (const section of allSections) {
      const keys = allKeys[section] || [];
      const changedKeys: string[] = [];

      for (const key of keys) {
        if (event.affectsConfiguration(`flowguard.${section}.${key}`)) {
          changedKeys.push(key);
        }
      }

      if (changedKeys.length > 0) {
        this.notifyWatchers(section, changedKeys);
      }
    }
  }

  private notifyWatchers(changedSection: string, changedKeys: string[]): void {
    const watchers = this.watchers.get(changedSection) || [];
    const wildcardWatchers = this.watchers.get('*') || [];
    const allWatchers = [...watchers, ...wildcardWatchers];

    const debounceKey = `${changedSection}:${changedKeys.join(',')}`;

    let debouncedWatcher = this.debouncedWatchers.get(debounceKey);
    
    if (!debouncedWatcher) {
      debouncedWatcher = {
        oldValue: configurationManager.getAll(),
        newValue: configurationManager.getAll(),
        handlers: []
      };
      this.debouncedWatchers.set(debounceKey, debouncedWatcher);
    }

    debouncedWatcher.newValue = configurationManager.getAll();

    const matchingWatchers = allWatchers.filter(watcher => 
      this.matchesPattern(watcher.pattern, changedSection, changedKeys)
    );

    debouncedWatcher.handlers = matchingWatchers;

    if (this.debounceTimers.has(debounceKey)) {
      clearTimeout(this.debounceTimers.get(debounceKey));
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(debounceKey);
      const dw = this.debouncedWatchers.get(debounceKey);
      if (dw) {
        this.debouncedWatchers.delete(debounceKey);
        
        for (const watcherRegistration of dw.handlers) {
          try {
            const result = watcherRegistration.handler(dw.newValue, dw.oldValue, {
              section: changedSection,
              keys: changedKeys
            });
            if (result instanceof Promise) {
              result.catch(error => {
                console.error(`Error in configuration watcher for ${watcherRegistration.section}:`, error);
              });
            }
          } catch (error) {
            console.error(`Error in configuration watcher for ${watcherRegistration.section}:`, error);
          }
        }
      }
    }, this.debounceDelay);

    this.debounceTimers.set(debounceKey, timer);
  }

  registerWatcher(section: string, pattern: string, handler: WatcherHandler): vscode.Disposable {
    if (!this.watchers.has(section)) {
      this.watchers.set(section, []);
    }

    const registration: WatcherRegistration = {
      section,
      pattern,
      handler,
      disposable: {
        dispose: () => {
          const sectionWatchers = this.watchers.get(section);
          if (sectionWatchers) {
            const index = sectionWatchers.findIndex(w => w.handler === handler);
            if (index !== -1) {
              sectionWatchers.splice(index, 1);
            }
          }
        }
      }
    };

    this.watchers.get(section)!.push(registration);

    return registration.disposable;
  }

  private setupBuiltInWatchers(): void {
    this.registerWatcher('general', 'logLevel', (newValue, oldValue, changes) => {
      if (changes?.keys.includes('logLevel')) {
        const config = configurationManager.getGeneralConfig();
        setLogLevel(config.logLevel);
      }
    });

    this.registerWatcher('llm', 'provider', (newValue, oldValue, changes) => {
      if (changes?.keys.includes('provider') || changes?.keys.includes('model')) {
        console.log('LLM provider or model changed, services may need to be recreated');
      }
    });

    this.registerWatcher('templates', 'customPath', (newValue, oldValue, changes) => {
      if (changes?.keys.includes('customPath')) {
        console.log('Template path changed, templates may need to be reloaded');
      }
    });

    this.registerWatcher('codebase', '*', (newValue, oldValue, changes) => {
      if (changes && changes.keys.length > 0) {
        console.log(`Codebase configuration changed: ${changes.keys.join(', ')}, file scanner may need to be updated`);
      }
    });
  }

  setDebounceDelay(delay: number): void {
    this.debounceDelay = delay;
  }

  getRegisteredWatchers(): Map<string, WatcherRegistration[]> {
    return new Map(this.watchers);
  }

  getWatcherCount(): number {
    let count = 0;
    this.watchers.forEach(watchers => {
      count += watchers.length;
    });
    return count;
  }
}

export const configurationWatcher = ConfigurationWatcher.getInstance();
