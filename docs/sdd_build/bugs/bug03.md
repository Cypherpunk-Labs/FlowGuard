So the following issues have been identified using F5 debug and reviewing the application by human hand. The application is currently unusable. please debug and fix the issues identified. 

- Upon Loading
FlowGuard initialization failed: OpenAI API key is required

- When clicking left plus symbol
command 'flowguard.createSpec' not found

- when clicking right plus symbol
command 'flowguard.createTicket' not found

- when clicking the refresh symbol
command 'flowguard.refreshSidebar' not found

- when using command pallete none of the 17 flowguard commands work, example of errors below. 
command 'flowguard.startTutorial' not found

command 'flowguard.createEpic' not found

command 'flowguard.listPlugins' not found

- In the outputs view there appears to be 2 FlowGuard options, each with a different message.
A:
[INFO] 2026-02-07T13:07:31.389Z - ArtifactStorage initialized

B:
FlowGuard initialized successfully

- it did create some empty folders.
It has created a .flowguard/ directory with 6 subfolders.

There is no way to configure the LLM options, i'd like to use openrouter and opencode. 

How can we improve UI testing to give feedback to LLM. 