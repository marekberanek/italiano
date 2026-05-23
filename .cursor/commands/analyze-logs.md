# Read Logs — Application Log Inspection Command

## Purpose
Instructs the agent to read and analyze the logs from the running application in the terminal. The goal is to identify errors, warnings, or other relevant events that may help diagnose and solve potential issues.

## Command Workflow

1. **Access Application Logs**
   - Open the terminal or log output window where the application is running.
   - If logs are not visible, use the appropriate command to display them (e.g., `docker logs <container>`, `tail -f logs/app.log`, or the relevant process output).

2. **Read and Analyze Logs**
   - Carefully read the most recent log entries, focusing on:
     - Errors (e.g., stack traces, uncaught exceptions)
     - Warnings
     - Repeated or suspicious messages
     - Timestamps and correlation IDs (if present)
   - Identify any patterns or recurring issues.

3. **Summarize Findings**
   - List the key log events that may indicate the root cause of the issue.
   - For each relevant log entry, include:
     - Timestamp (if available)
     - Log level (ERROR, WARN, INFO, etc.)
     - Message content (quote or paraphrase)
     - Any associated request IDs or user/session info

4. **Suggest Next Steps**
   - Based on the log findings, propose concrete next actions (e.g., investigate a specific error, restart a service, check configuration, etc.).

## Output Format

- **Quick Summary**: 2–3 bullet points summarizing the most important log findings.
- **Log Excerpts Table**:

  | Timestamp        | Level  | Message/Context                                   |
  |------------------|--------|---------------------------------------------------|
  | 2024-06-01 12:34 | ERROR  | "Database connection failed: timeout"             |
  | 2024-06-01 12:35 | WARN   | "Retrying connection (attempt 2/3)"               |

- **Analysis**: Short explanation of what the logs suggest about the issue.
- **Recommended Actions**: List of next steps to resolve or further investigate the problem.

## Notes

- If logs are missing or inaccessible, state this clearly and suggest how to enable or access them.
- Do not include sensitive information (e.g., secrets, passwords) in the output.
- If the application uses structured logging, leverage fields like `correlationId` or `requestId` to group related events.

## Example

**Quick Summary**
- ERROR: Database connection failed at 12:34.
- WARN: Application is retrying connection.
- No successful connection established in the last 5 minutes.

**Log Excerpts Table**

| Timestamp        | Level  | Message/Context                                   |
|------------------|--------|---------------------------------------------------|
| 2024-06-01 12:34 | ERROR  | "Database connection failed: timeout"             |
| 2024-06-01 12:35 | WARN   | "Retrying connection (attempt 2/3)"               |

**Analysis**
- The application cannot connect to the database, likely due to a network or configuration issue.

**Recommended Actions**
- Check database server status and network connectivity.
- Verify database credentials and configuration.
- Restart the application after resolving the database issue.
