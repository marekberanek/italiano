
## Command Workflow
 1. **Run all tests** using the project's test runner ```npm test``` from -server folder.
 2. **If all tests pass**: Output a success message.
 3. **If any test fails**:
    - For each failing test, analyze the failure and determine if the test itself is correct and well-designed.
    - If a test is unclear or not based on requirements, redesign the test first (do not simply "fix" the test to match the code).
    - Once the test is correct, update the implementation code so that it passes the test.
    - Repeat until all tests pass and all tests are properly designed.
 4. **Output a summary** of actions taken, including:
    - Which tests failed and why
    - Any test redesigns (with rationale)
    - Code changes made to pass the tests
    - Final test run result

 ## Principles
 - **Test-Driven**: Always design or verify the test first, then implement or fix the code.
 - **No test adjustment to broken code**: Never change a test just to make it pass unless the test is truly incorrect.
 - **Documentation**: For each fix, document the reasoning (test design, code change, requirement reference).