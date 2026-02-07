import { Tutorial } from '../TutorialManager';
import { ArtifactStorage } from '../../core/storage/ArtifactStorage';
import { GitHelper } from '../../core/git/GitHelper';

// We'll inject the storage instance when registering the tutorial
let artifactStorage: ArtifactStorage | null = null;
let gitHelper: GitHelper | null = null;

export function setArtifactStorage(storage: ArtifactStorage, git: GitHelper): void {
  artifactStorage = storage;
  gitHelper = git;
}

export const VerificationTutorial: Tutorial = {
  id: 'verification',
  title: 'Verification Workflow',
  description: 'Learn how to verify your code changes with FlowGuard',
  setArtifactStorage: setArtifactStorage,
  steps: [
    {
      id: 'make-changes',
      title: 'Make Code Changes',
      description: 'Make some changes to your code that can be verified.',
      action: {
        type: 'fileOpen',
        value: '*.*'
      },
      validation: async () => {
        // Check if file has been modified
        if (!gitHelper) {
          return false;
        }
        
        try {
          const status = await gitHelper.getStatus();
          // Check if there are any modified, created, or deleted files
          return status.modified.length > 0 || 
                 status.created.length > 0 || 
                 status.deleted.length > 0;
        } catch (error) {
          return false;
        }
      },
      hints: [
        'Open any source file in your project',
        'Make a small change to the code',
        'Save the file'
      ]
    },
    {
      id: 'run-verification',
      title: 'Run Verification',
      description: 'Run FlowGuard verification on your changes.',
      action: {
        type: 'command',
        value: 'flowguard.verifyChanges'
      },
      validation: async () => {
        // Check if verification has been run
        if (!artifactStorage) {
          return false;
        }
        
        try {
          // Check if there's at least one verification
          const verifications = await artifactStorage.listVerifications();
          return verifications.length > 0;
        } catch (error) {
          return false;
        }
      },
      hints: [
        'Press Ctrl+Shift+P (or Cmd+Shift+P on Mac) to open the command palette',
        'Type "FlowGuard: Verify Changes" and select the command',
        'Select the diff source (Git diff, GitHub PR, etc.)'
      ]
    },
    {
      id: 'review-results',
      title: 'Review Verification Results',
      description: 'Examine the verification results and identified issues.',
      action: {
        type: 'validation',
        value: null
      },
      validation: async () => {
        // Check if user has reviewed results
        // Since we can't directly check UI actions, we'll check if a verification exists
        if (!artifactStorage) {
          return false;
        }
        
        try {
          // Check if there's at least one verification
          const verifications = await artifactStorage.listVerifications();
          return verifications.length > 0;
        } catch (error) {
          return false;
        }
      },
      hints: [
        'Check the FlowGuard sidebar for verification results',
        'Review any identified issues',
        'Note the severity levels (Critical, High, Medium, Low)'
      ]
    },
    {
      id: 'apply-auto-fix',
      title: 'Apply Auto-fix',
      description: 'Apply automatic fixes for issues that support them.',
      action: {
        type: 'command',
        value: 'flowguard.applyAutoFix'
      },
      validation: async () => {
        // Check if auto-fix has been applied
        // Since we can't directly check UI actions, we'll check if a verification exists with issues
        if (!artifactStorage) {
          return false;
        }
        
        try {
          // Check if there's at least one verification with issues
          const verifications = await artifactStorage.listVerifications();
          return verifications.some(v => v.issues && v.issues.length > 0);
        } catch (error) {
          return false;
        }
      },
      hints: [
        'Find an issue with an auto-fix available',
        'Click the "Apply Fix" button or use the command palette',
        'Review the changes before committing'
      ]
    },
    {
      id: 'approve-changes',
      title: 'Approve Changes',
      description: 'Approve the verification results to complete the workflow.',
      action: {
        type: 'command',
        value: 'flowguard.approveVerification'
      },
      validation: async () => {
        // Check if verification has been approved
        // Since we can't directly check approval status, we'll check if a verification exists
        if (!artifactStorage) {
          return false;
        }
        
        try {
          // Check if there's at least one verification
          const verifications = await artifactStorage.listVerifications();
          return verifications.length > 0;
        } catch (error) {
          return false;
        }
      },
      hints: [
        'Use the command palette to run "FlowGuard: Approve Verification"',
        'Add any conditional notes if needed',
        'Confirm the approval'
      ]
    }
  ]
};