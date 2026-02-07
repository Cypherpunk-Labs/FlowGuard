import { Tutorial } from '../TutorialManager';
import { ArtifactStorage } from '../../core/storage/ArtifactStorage';
import { EpicMetadataManager } from '../../core/storage/EpicMetadataManager';

// We'll inject the storage instance when registering the tutorial
let artifactStorage: ArtifactStorage | null = null;
let epicMetadataManager: EpicMetadataManager | null = null;

export function setArtifactStorage(storage: ArtifactStorage, metadataManager: EpicMetadataManager): void {
  artifactStorage = storage;
  epicMetadataManager = metadataManager;
}

export const FirstEpicTutorial: Tutorial = {
  id: 'first-epic',
  title: 'Create Your First Epic',
  description: 'Learn how to create your first epic in FlowGuard',
  steps: [
    {
      id: 'initialize-epic',
      title: 'Initialize Your First Epic',
      description: 'Create a new epic to organize your development work.',
      action: {
        type: 'command',
        value: 'flowguard.initializeEpic'
      },
      validation: async () => {
        // Check if an epic exists
        if (!epicMetadataManager) {
          return false;
        }
        
        try {
          return await epicMetadataManager.epicExists();
        } catch (error) {
          return false;
        }
      },
      hints: [
        'Press Ctrl+Shift+P (or Cmd+Shift+P on Mac) to open the command palette',
        'Type "FlowGuard: Initialize Epic" and select the command',
        'Enter a name and description for your epic'
      ]
    },
    {
      id: 'create-spec',
      title: 'Create a Specification',
      description: 'Create a specification to define a feature or component.',
      action: {
        type: 'command',
        value: 'flowguard.createSpec'
      },
      validation: async () => {
        // Check if a spec exists
        if (!artifactStorage || !epicMetadataManager) {
          return false;
        }
        
        try {
          // Check if epic exists first
          const epicExists = await epicMetadataManager.epicExists();
          if (!epicExists) {
            return false;
          }
          
          // Load epic metadata to get epicId
          const metadata = await epicMetadataManager.loadEpicMetadata();
          const specs = await artifactStorage.listSpecs(metadata.epicId);
          return specs.length > 0;
        } catch (error) {
          return false;
        }
      },
      hints: [
        'Use the command palette to run "FlowGuard: Create Specification"',
        'Associate the specification with your epic',
        'Provide a clear title and description'
      ]
    },
    {
      id: 'edit-spec-metadata',
      title: 'Edit Specification Metadata',
      description: 'Update the specification with additional metadata like tags and status.',
      action: {
        type: 'fileOpen',
        value: '*.md' // This would need to be more specific
      },
      validation: async () => {
        // Check if spec metadata has been edited
        if (!artifactStorage || !epicMetadataManager) {
          return false;
        }
        
        try {
          // Check if epic exists first
          const epicExists = await epicMetadataManager.epicExists();
          if (!epicExists) {
            return false;
          }
          
          // Load epic metadata to get epicId
          const metadata = await epicMetadataManager.loadEpicMetadata();
          const specs = await artifactStorage.listSpecs(metadata.epicId);
          
          // Check if any spec has tags (indicating metadata was edited)
          return specs.some(spec => spec.tags && spec.tags.length > 0);
        } catch (error) {
          return false;
        }
      },
      hints: [
        'Open the specification file in the editor',
        'Edit the YAML frontmatter at the top of the file',
        'Add relevant tags to categorize your specification'
      ]
    },
    {
      id: 'create-ticket',
      title: 'Create a Ticket from Specification',
      description: 'Generate an implementation ticket from your specification.',
      action: {
        type: 'command',
        value: 'flowguard.generateTicketsFromSpec'
      },
      validation: async () => {
        // Check if a ticket has been created
        if (!artifactStorage || !epicMetadataManager) {
          return false;
        }
        
        try {
          // Check if epic exists first
          const epicExists = await epicMetadataManager.epicExists();
          if (!epicExists) {
            return false;
          }
          
          // Load epic metadata to get epicId
          const metadata = await epicMetadataManager.loadEpicMetadata();
          const tickets = await artifactStorage.listTickets(metadata.epicId);
          return tickets.length > 0;
        } catch (error) {
          return false;
        }
      },
      hints: [
        'With your specification open, use the command palette',
        'Run "FlowGuard: Generate Tickets from Spec"',
        'Review the generated tickets and confirm creation'
      ]
    },
    {
      id: 'generate-handoff',
      title: 'Generate Agent Handoff',
      description: 'Create a handoff document for an AI assistant to implement your ticket.',
      action: {
        type: 'command',
        value: 'flowguard.generateHandoff'
      },
      validation: async () => {
        // Check if a handoff has been generated
        if (!artifactStorage || !epicMetadataManager) {
          return false;
        }
        
        try {
          // Check if epic exists first
          const epicExists = await epicMetadataManager.epicExists();
          if (!epicExists) {
            return false;
          }
          
          // Load epic metadata to get epicId
          const metadata = await epicMetadataManager.loadEpicMetadata();
          const executions = await artifactStorage.listExecutions(metadata.epicId);
          return executions.length > 0;
        } catch (error) {
          return false;
        }
      },
      hints: [
        'Open your ticket in the editor',
        'Use the command palette to run "FlowGuard: Generate Handoff"',
        'Select an agent template for your AI assistant'
      ]
    }
  ]
};
