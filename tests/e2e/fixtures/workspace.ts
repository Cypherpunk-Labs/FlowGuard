import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface TestWorkspaceConfig {
  epicId?: string;
  epicTitle?: string;
  specs?: Array<{
    id: string;
    title: string;
    status: string;
  }>;
  tickets?: Array<{
    id: string;
    title: string;
    specId: string;
    status: string;
  }>;
}

export class TestWorkspace {
  private basePath: string;
  private workspacePath: string;

  constructor(basePath: string = path.resolve(__dirname, '../../../test-workspace')) {
    this.basePath = basePath;
    this.workspacePath = basePath;
  }

  async createTestWorkspace(config?: TestWorkspaceConfig): Promise<string> {
    const workspaceId = uuidv4();
    this.workspacePath = path.join(this.basePath, `temp-${workspaceId}`);
    
    fs.mkdirSync(this.workspacePath, { recursive: true });
    fs.mkdirSync(path.join(this.workspacePath, '.flowguard'), { recursive: true });
    fs.mkdirSync(path.join(this.workspacePath, '.flowguard', 'specs'), { recursive: true });
    fs.mkdirSync(path.join(this.workspacePath, '.flowguard', 'tickets'), { recursive: true });
    fs.mkdirSync(path.join(this.workspacePath, '.flowguard', 'executions'), { recursive: true });
    fs.mkdirSync(path.join(this.workspacePath, '.flowguard', 'verifications'), { recursive: true });
    fs.mkdirSync(path.join(this.workspacePath, 'src'), { recursive: true });

    if (config) {
      await this.seedWorkspaceWithArtifacts(config);
    }

    return this.workspacePath;
  }

  async seedWorkspaceWithArtifacts(config: TestWorkspaceConfig): Promise<void> {
    if (config.epicId) {
      const epicMetadata = {
        id: config.epicId,
        title: config.epicTitle || 'Test Epic',
        description: 'Test epic for E2E testing',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['e2e-test'],
        specIds: config.specs?.map(s => s.id) || [],
        ticketIds: config.tickets?.map(t => t.id) || []
      };

      fs.writeFileSync(
        path.join(this.workspacePath, '.flowguard', 'epic.json'),
        JSON.stringify(epicMetadata, null, 2)
      );
    }

    if (config.specs) {
      for (const spec of config.specs) {
        const specContent = `---
id: ${spec.id}
title: ${spec.title}
status: ${spec.status}
epicId: ${config.epicId || 'test-epic'}
author: E2E Test
createdAt: ${new Date().toISOString()}
updatedAt: ${new Date().toISOString()}
tags: [e2e-test]
---

# ${spec.title}

## Overview

Test spec for E2E testing.

## Requirements

1. Test requirement
`;

        fs.writeFileSync(
          path.join(this.workspacePath, '.flowguard', 'specs', `spec-${spec.id}.md`),
          specContent
        );
      }
    }

    if (config.tickets) {
      for (const ticket of config.tickets) {
        const ticketContent = `---
id: ${ticket.id}
title: ${ticket.title}
status: ${ticket.status}
epicId: ${config.epicId || 'test-epic'}
specId: ${ticket.specId}
priority: medium
createdAt: ${new Date().toISOString()}
updatedAt: ${new Date().toISOString()}
tags: [e2e-test]
---

# ${ticket.title}

## Description

Test ticket for E2E testing.

Related Spec: [spec:${ticket.specId}]

## Acceptance Criteria

- [ ] Test criterion
`;

        fs.writeFileSync(
          path.join(this.workspacePath, '.flowguard', 'tickets', `ticket-${ticket.id}.md`),
          ticketContent
        );
      }
    }

    const sampleTs = `export function sample() {
  return 'test';
}`;
    fs.writeFileSync(
      path.join(this.workspacePath, 'src', 'sample.ts'),
      sampleTs
    );
  }

  async cleanupTestWorkspace(): Promise<void> {
    if (this.workspacePath && this.workspacePath !== this.basePath) {
      fs.rmSync(this.workspacePath, { recursive: true, force: true });
    }
  }

  getWorkspacePath(): string {
    return this.workspacePath;
  }
}
