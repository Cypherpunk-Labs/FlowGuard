# Diagrams

This directory contains architecture and workflow diagrams for the FlowGuard documentation.

## Planned Diagrams

- High-level architecture diagram (Mermaid)
- Epic creation workflow (Mermaid sequence diagram)
- Specification lifecycle (Mermaid flowchart)
- Ticket generation workflow (Mermaid sequence diagram)
- Verification process flow (Mermaid flowchart)
- Handoff generation workflow (Mermaid sequence diagram)
- Plugin system architecture (Mermaid diagram)
- Data flow between components (Mermaid flowchart)

## Example Diagrams

This directory includes example diagrams in Mermaid format:

1. `architecture-overview.mmd` - Graph showing the overall system architecture
2. `epic-creation-workflow.mmd` - Sequence diagram showing the epic creation process
3. `spec-lifecycle.mmd` - Flowchart showing the specification lifecycle
4. `ticket-generation-workflow.mmd` - Sequence diagram showing ticket generation
5. `verification-process.mmd` - Flowchart showing the verification workflow
6. `handoff-generation-workflow.mmd` - Sequence diagram showing handoff generation
7. `plugin-system-architecture.mmd` - Graph showing the plugin system architecture
8. `data-flow.mmd` - Flowchart showing data flow between components

## Using Mermaid Diagrams

To view these diagrams locally:

1. Install the Mermaid CLI:
   ```bash
   npm install -g @mermaid-js/mermaid-cli
   ```

2. Generate PNG images from Mermaid files:
   ```bash
   mmdc -i diagram.mmd -o diagram.png
   ```

3. Or use the Mermaid Live Editor at https://mermaid.live to view and edit diagrams.

## Contributing Diagrams

When creating new diagrams:

1. Use descriptive filenames with `.mmd` extension
2. Include a title and description in the diagram
3. Follow consistent styling with the existing diagrams
4. Keep diagrams focused on a single workflow or concept
5. Update this README to list new diagrams