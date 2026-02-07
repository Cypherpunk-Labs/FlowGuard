# Troubleshooting Guide

This guide provides solutions to common issues you may encounter when using FlowGuard.

## Common Issues

### Extension Not Activating

**Symptoms:**
- FlowGuard commands are not available
- Sidebar views are not showing
- No error messages in the output panel

**Solutions:**
1. Check that you have an open workspace folder
2. Verify that FlowGuard is enabled in the Extensions view
3. Check the Output panel for any error messages from FlowGuard
4. Restart VS Code to refresh the extension
5. Check that your VS Code version meets the minimum requirements

### LLM Provider Errors

**Symptoms:**
- API key validation errors
- Network connectivity issues
- Rate limit exceeded messages
- Service unavailable errors

**Solutions:**
1. **Invalid API Key:**
   - Verify your API key is correct
   - Use the "FlowGuard: Enter API Key" command to securely store your key
   - Check that your API key has the necessary permissions

2. **Network Connectivity:**
   - Check your internet connection
   - Verify that your network allows connections to the LLM provider
   - Check if you need to configure proxy settings

3. **Rate Limits:**
   - Wait for the rate limit period to expire
   - Consider upgrading your API plan for higher limits
   - Reduce the frequency of requests

4. **Service Unavailable:**
   - Check the LLM provider's status page for outages
   - Try again later
   - Consider switching to a different provider temporarily

### Codebase Scan Timeout

**Symptoms:**
- Slow performance when scanning large projects
- Timeout errors during codebase analysis
- Incomplete codebase context in specifications

**Solutions:**
1. **Adjust Scan Limits:**
   - Reduce `flowguard.codebase.maxFilesToScan` in settings
   - Add more specific exclude patterns to skip unnecessary files

2. **Optimize Exclude Patterns:**
   - Add common build directories: `node_modules/**`, `dist/**`, `.git/**`
   - Exclude log files: `*.log`
   - Skip generated files: `*.min.js`, `*.bundle.js`

3. **Performance Tuning:**
   - Reduce `flowguard.codebase.scanConcurrency` if system resources are limited
   - Increase `flowguard.codebase.scanTimeout` for large files

### Plugin Loading Failures

**Symptoms:**
- Plugins not appearing in the sidebar
- Plugin commands not available
- Error messages about plugin loading

**Solutions:**
1. **Manifest Validation:**
   - Check that `plugin.json` exists and is properly formatted
   - Verify all required fields are present
   - Ensure the `main` entry point file exists

2. **Dependency Issues:**
   - Run `npm install` in the plugin directory
   - Check that all required dependencies are installed
   - Verify compatibility with your FlowGuard version

3. **Security Validation:**
   - Review plugin code for security concerns
   - Add the plugin to `trustedPlugins` configuration if needed
   - Check that the plugin follows security best practices

### Verification Not Running

**Symptoms:**
- No verification results appearing
- Diff format errors
- Spec reference issues

**Solutions:**
1. **Diff Format:**
   - Verify the diff source is accessible
   - Check that the diff format is supported
   - Try using a different diff source

2. **Spec References:**
   - Verify that referenced specifications exist
   - Check reference syntax (`spec:name`, not `Spec:Name`)
   - Ensure no typos in reference names

### Auto-save Not Working

**Symptoms:**
- Changes not being saved automatically
- Manual saves required
- Data loss concerns

**Solutions:**
1. **Check Settings:**
   - Verify that `flowguard.editor.autoSave` is enabled
   - Check VS Code's auto-save settings
   - Ensure sufficient file system permissions

2. **File System Issues:**
   - Check available disk space
   - Verify write permissions for the workspace directory
   - Check for file system errors

## Debugging

### Enable Debug Logging

1. Set `flowguard.general.logLevel` to `DEBUG` in settings
2. Open the Output panel and select "FlowGuard" from the dropdown
3. Review debug messages for insights into the issue

### View Output Channel

1. Open the Output panel (`Ctrl+Shift+U` or `Cmd+Shift+U`)
2. Select "FlowGuard" from the channel dropdown
3. Review log messages for error details

### Check Extension Logs

1. Open Developer Tools (`Help > Toggle Developer Tools`)
2. Check the Console tab for any error messages
3. Look for FlowGuard-related errors

### Git Integration Issues

1. Verify `simple-git` configuration
2. Check Git repository status
3. Ensure proper Git credentials are configured
4. Test Git commands manually in the terminal

## Performance Issues

### Slow Codebase Scanning

**Symptoms:**
- Long delays when opening specifications
- Slow response when generating handoffs
- High CPU usage during scanning

**Solutions:**
1. **Incremental Scan Settings:**
   - Enable incremental scanning if available
   - Reduce the frequency of full scans

2. **File Exclusions:**
   - Add more specific exclude patterns
   - Exclude large binary files
   - Skip third-party libraries

### High Memory Usage

**Symptoms:**
- VS Code becoming unresponsive
- System memory exhaustion
- Slow performance across all applications

**Solutions:**
1. **Reduce Scan Limits:**
   - Lower `flowguard.codebase.maxFilesToScan`
   - Clear cache regularly using `FlowGuard: Clear Codebase Cache`

2. **Optimize Workspace:**
   - Close unnecessary files and projects
   - Reduce the number of open workspaces
   - Use workspace folders to organize large projects

### Webview Rendering Lag

**Symptoms:**
- Slow sidebar updates
- Delayed editor rendering
- Unresponsive UI elements

**Solutions:**
1. **Disable Diagram Preview:**
   - Turn off diagram preview in settings
   - Reduce the number of artifacts displayed simultaneously

2. **Reduce Artifact Count:**
   - Archive completed epics
   - Delete unnecessary specifications and tickets
   - Use filtering to focus on relevant items

## Error Messages Reference

| Error Code | Message | Cause | Solution |
|------------|---------|-------|----------|
| FG-001 | Invalid API key | Incorrect or missing API key | Use "FlowGuard: Enter API Key" command |
| FG-002 | Rate limit exceeded | Too many requests to LLM provider | Wait or upgrade API plan |
| FG-003 | Service unavailable | LLM provider outage | Try again later or switch providers |
| FG-004 | Plugin manifest validation failed | Invalid plugin.json | Check plugin manifest format |
| FG-005 | Plugin dependency missing | Missing npm dependencies | Run `npm install` in plugin directory |
| FG-006 | Codebase scan timeout | Large project or slow system | Adjust scan settings or exclude files |
| FG-007 | Reference not found | Invalid spec or ticket reference | Check reference syntax and existence |
| FG-008 | Auto-save failed | File system permissions | Check write permissions for workspace |

## Additional Resources

- [FAQ](faq.md) - Frequently asked questions
- [Configuration Reference](reference/configuration.md) - Detailed configuration options
- [GitHub Issues](https://github.com/your-repo/issues) - Report bugs or request features
- [Community Discord](#) - Get help from the community (link to be added)
