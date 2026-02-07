import { Tutorial } from '../TutorialManager';
import { ArtifactStorage } from '../../core/storage/ArtifactStorage';

// We'll inject the storage instance when registering the tutorial
let artifactStorage: ArtifactStorage | null = null;

export function setArtifactStorage(storage: ArtifactStorage): void {
  artifactStorage = storage;
}

export const HandoffTutorial: Tutorial = {
  id: 'handoff',
  title: 'Agent Handoff Workflow',
  description: 'Learn how to create and use agent handoffs for AI-assisted development',
  // Add the setArtifactStorage method to match FirstEpicTutorial
  setArtifactStorage: setArtifactStorage,
  steps: [
    {
      id: 'prepare-ticket',
      title: 'Prepare a Ticket for Handoff',
      description: 'Ensure you have a ticket with sufficient detail for handoff generation.',
      action: {
        type: 'fileOpen',
        value: '*.ticket.md'
      },
      validation: async () => {
        // Check if a ticket exists and has sufficient detail
        if (!artifactStorage) {
          return false;
        }
        
        try {
          // Check if there's at least one ticket
          const tickets = await artifactStorage.listTickets();
          return tickets.length > 0;
        } catch (error) {
          return false;
        }
      },
      hints: [
        'Open an existing ticket or create a new one',
        'Ensure the ticket has a clear title and detailed description',
        'Add any relevant implementation notes or requirements',
        'Save your changes'
      ]
    },
    {
      id: 'generate-handoff',
      title: 'Generate a Handoff Document',
      description: 'Create a handoff document that packages all relevant context for an AI agent.',
      action: {
        type: 'command',
        value: 'flowguard.generateHandoff'
      },
      validation: async () => {
        // Check if a handoff has been generated
        if (!artifactStorage) {
          return false;
        }
        
        try {
          // Check if there's at least one execution (handoff)
          const executions = await artifactStorage.listExecutions();
          return executions.length > 0;
        } catch (error) {
          return false;
        }
      },
      hints: [
        'Open your ticket in the editor',
        'Use the command palette to run "FlowGuard: Generate Handoff"',
        'Select an appropriate agent template',
        'Review the generated handoff document'
      ]
    },
    {
      id: 'customize-handoff',
      title: 'Customize Handoff Content',
      description: 'Modify handoff content to better suit your specific needs.',
      action: {
        type: 'fileOpen',
        value: '*.handoff.md'
      },
      validation: async () => {
        // Check if handoff content has been customized
        // For now, we'll just check if an execution exists
        if (!artifactStorage) {
          return false;
        }
        
        try {
          // Check if there's at least one execution (handoff)
          const executions = await artifactStorage.listExecutions();
          return executions.length > 0;
        } catch (error) {
          return false;
        }
      },
      hints: [
        'Edit the handoff document directly in the preview',
        'Add or remove specific files from the context',
        'Include or exclude code snippets as needed',
        'Add specific instructions for the AI assistant'
      ]
    },
    {
      id: 'use-with-ai',
      title: 'Use Handoff with AI Assistant',
      description: 'Copy the handoff to your AI assistant and observe the results.',
      action: {
        type: 'command',
        value: 'flowguard.copyHandoffToClipboard'
      },
      validation: async () => {
        // Check if handoff has been copied to clipboard
        // Since we can't directly check clipboard, we'll check if an execution exists
        if (!artifactStorage) {
          return false;
        }
        
        try {
          // Check if there's at least one execution (handoff)
          const executions = await artifactStorage.listExecutions();
          return executions.length > 0;
        } catch (error) {
          return false;
        }
      },
      hints: [
        'Copy the handoff content to your clipboard using the "Copy to Clipboard" button',
        'Paste it into your AI assistant\'s input field',
        'Add any additional instructions or questions',
        'Send the prompt to your AI assistant'
      ]
    },
    {
      id: 'track-execution',
      title: 'Track Handoff Execution',
      description: 'Mark the handoff as executed and track the results in FlowGuard.',
      action: {
        type: 'command',
        value: 'flowguard.trackHandoffExecution'
      },
      validation: async () => {
        // Check if handoff execution has been tracked
        // Since we can't directly check UI actions, we'll check if an execution exists
        if (!artifactStorage) {
          return false;
        }
        
        try {
          // Check if there's at least one execution (handoff)
          const executions = await artifactStorage.listExecutions();
          return executions.length > 0;
        } catch (error) {
          return false;
        }
      },
      hints: [
        'After using a handoff, mark it as executed in FlowGuard',
        'Link any generated code changes to the original ticket',
        'Update ticket status to reflect progress',
        'Add notes about the AI assistant\'s performance'
      ]
    }
  ]
};