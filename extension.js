const fs = require('fs');
const path = require('path');
const vscode = require('vscode');
const { execSync } = require('child_process');
const puppeteer = require('puppeteer');

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
  console.log('Congratulations, your extension "leetcode-help" is now active!');

  // Status bar buttons
  const fetchTestCasesButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  fetchTestCasesButton.text = '$(cloud-download) Fetch Test Cases';
  fetchTestCasesButton.command = 'leetcode-help.fetchTestCases';
  fetchTestCasesButton.tooltip = 'Fetch test cases from a LeetCode problem';
  fetchTestCasesButton.show();

  const runTestCasesButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
  runTestCasesButton.text = '$(play) Run Test Cases';
  runTestCasesButton.command = 'leetcode-help.runTestCases';
  runTestCasesButton.tooltip = 'Run test cases against your solution';
  runTestCasesButton.show();

  context.subscriptions.push(fetchTestCasesButton, runTestCasesButton);

  // Command to fetch test cases with language selection via GUI
  const fetchTestCases = vscode.commands.registerCommand('leetcode-help.fetchTestCases', async function () {
    // Create Webview Panel for Language Selection
    const panel = vscode.window.createWebviewPanel(
      'languageSelection',
      'Select Language (C++/Python)',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    // Set the HTML content for the Webview Panel
    panel.webview.html = getLanguageSelectionHtml();

    // Listen for messages from the Webview
    panel.webview.onDidReceiveMessage(async (message) => {
      if (message.command === 'languageSelected') {
        const selectedLanguage = message.language;
        const leetcodeUrl = await vscode.window.showInputBox({
          placeHolder: 'Enter the LeetCode URL to scrape',
          validateInput: (text) => {
            try {
              new URL(text);
              return null;
            } catch {
              return 'Please enter a valid URL';
            }
          }
        });

        if (!leetcodeUrl) return;

        try {
          await fetchAndGenerateTemplate(selectedLanguage, leetcodeUrl, context);
          vscode.window.showInformationMessage(`${selectedLanguage} template written successfully!`);
        } catch (error) {
          vscode.window.showErrorMessage('Failed to fetch test cases and problem template.');
        }
      }
    });
  });

  context.subscriptions.push(fetchTestCases);

  // Command to run test cases
  const runTestCases = vscode.commands.registerCommand('leetcode-help.runTestCases', async function () {
    try {
      const folderPath = path.join(context.extensionPath, 'testcases');
      const codeCppPath = path.join(context.extensionPath, 'code.cpp');
      const codePyPath = path.join(context.extensionPath, 'code.py');

      let codeFilePath;
      if (fs.existsSync(codeCppPath)) {
        codeFilePath = codeCppPath;
      } else if (fs.existsSync(codePyPath)) {
        codeFilePath = codePyPath;
      } else {
        vscode.window.showErrorMessage('No code file found. Please fetch test cases first.');
        return;
      }

      if (!fs.existsSync(folderPath)) {
        vscode.window.showErrorMessage('Test cases not found. Please fetch test cases first.');
        return;
      }

      // Compile C++ code if it exists
      if (fs.existsSync(codeCppPath)) {
        try {
          execSync(`g++ "${codeCppPath}" -o code`, { cwd: context.extensionPath });
          console.log('C++ code compiled successfully.');
        } catch (error) {
          vscode.window.showErrorMessage('C++ compilation failed.');
          return;
        }
      }

      // Run test cases
      const testCaseFiles = fs.readdirSync(folderPath).filter(file => file.startsWith('input'));

      for (const testCaseFile of testCaseFiles) {
        const testCaseNumber = testCaseFile.match(/\d+/)[0];
        const inputFilePath = path.join(folderPath, testCaseFile);
        const expectedOutputFilePath = path.join(folderPath, `output${testCaseNumber}.txt`);
        const actualOutputFilePath = path.join(folderPath, `output${testCaseNumber}_tested.txt`);

        try {
          const codeExecutablePath = path.join(context.extensionPath, 'code.exe');
          execSync(`"${codeExecutablePath}" < "${inputFilePath}" > "${actualOutputFilePath}"`, { cwd: context.extensionPath });

          const expectedOutput = fs.readFileSync(expectedOutputFilePath, 'utf8').trim();
          const actualOutput = fs.readFileSync(actualOutputFilePath, 'utf8').trim();

          if (expectedOutput === actualOutput) {
            console.log(`Test case ${testCaseNumber}: Passed`);
            vscode.window.showInformationMessage(`Test case ${testCaseNumber}: Passed`);
          } else {
            console.log(`Test case ${testCaseNumber}: Failed`);
            console.log(`Expected: ${expectedOutput}`);
            console.log(`Actual: ${actualOutput}`);
            vscode.window.showInformationMessage(`Test case ${testCaseNumber}: Failed`);
            vscode.window.showInformationMessage(`Expected: ${expectedOutput}`);
            vscode.window.showInformationMessage(`Actual: ${actualOutput}`);
          }
        } catch (error) {
          console.error(`Error running test case ${testCaseNumber}:`, error.message);
        }
      }

      vscode.window.showInformationMessage('Test cases executed. Check console for details.');
    } catch (error) {
      console.error(error);
      vscode.window.showErrorMessage('Failed to run test cases.');
    }
  });

  context.subscriptions.push(runTestCases);
}

// Function to generate HTML for Language Selection Webview
function getLanguageSelectionHtml() {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Select Language</title>
      </head>
      <body>
        <h2>Select Programming Language</h2>
        <button id="cppButton">C++</button>
        <button id="pythonButton">Python</button>

        <script>
          const vscode = acquireVsCodeApi();

          document.getElementById('cppButton').addEventListener('click', () => {
            vscode.postMessage({ command: 'languageSelected', language: 'C++' });
          });

          document.getElementById('pythonButton').addEventListener('click', () => {
            vscode.postMessage({ command: 'languageSelected', language: 'Python' });
          });
        </script>
      </body>
    </html>
  `;
}

// Function to handle template fetching and file writing based on selected language
async function fetchAndGenerateTemplate(selectedLanguage, leetcodeUrl, context) {
  try {
    // Launch Puppeteer browser and fetch data from LeetCode
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      userDataDir: './tmp'
    });

    const page = await browser.newPage();
    await page.goto(leetcodeUrl);
    await page.waitForSelector('pre');

    const preContents = await page.$$eval('pre', elements =>
      elements.map(element => element.innerHTML.trim())
    );

    const codeTemplate = await page.$$eval('.view-lines.monaco-mouse-cursor-text .view-line span', spans =>
      spans.map(span => span.textContent).join('\n')
    );

    if (selectedLanguage === 'C++') {
      // Handle C++ Template
      const codeFilePath = path.join(context.extensionPath, 'code.cpp');
      fs.writeFileSync(codeFilePath, codeTemplate, 'utf8');
      const document = await vscode.workspace.openTextDocument(codeFilePath);
      await vscode.window.showTextDocument(document);
    } else if (selectedLanguage === 'Python') {
      // Handle Python Template
      const pythonTemplate = codeTemplate.replace('int main', 'def main()');
      const codeFilePath = path.join(context.extensionPath, 'code.py');
      fs.writeFileSync(codeFilePath, pythonTemplate, 'utf8');
      const document = await vscode.workspace.openTextDocument(codeFilePath);
      await vscode.window.showTextDocument(document);
    }

    await browser.close();
  } catch (error) {
    console.error(error);
    vscode.window.showErrorMessage('Failed to fetch and generate code template.');
  }
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
