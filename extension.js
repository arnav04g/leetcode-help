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

  const addTestCaseButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 98);
  addTestCaseButton.text = '$(add) Add Test Case';
  addTestCaseButton.command = 'leetcode-help.addTestCase';
  addTestCaseButton.tooltip = 'Add custom test case';
  addTestCaseButton.show();

  context.subscriptions.push(fetchTestCasesButton, runTestCasesButton, addTestCaseButton);

  // Command to fetch test cases with language selection via GUI
  const fetchTestCases = vscode.commands.registerCommand('leetcode-help.fetchTestCases', async function () {
    const panel = vscode.window.createWebviewPanel(
      'languageSelection',
      'Select Language (C++/Python)',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = getLanguageSelectionHtml();

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

      if (fs.existsSync(codeCppPath)) {
        try {
          execSync(`g++ "${codeCppPath}" -o code`, { cwd: context.extensionPath });
          console.log('C++ code compiled successfully.');
        } catch (error) {
          vscode.window.showErrorMessage('C++ compilation failed.');
          return;
        }
      }

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
            vscode.window.showInformationMessage(`Test case ${testCaseNumber}: Passed`);
          } else {
            vscode.window.showInformationMessage(`Test case ${testCaseNumber}: Failed`);
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

  const addTestCase = vscode.commands.registerCommand('leetcode-help.addTestCase', async function () {
    try {
      const input = await vscode.window.showInputBox({
        placeHolder: 'Enter the input for the test case',
        prompt: 'Input for the test case',
      });

      if (!input || input.trim() === '') {
        vscode.window.showErrorMessage('No input provided or input is empty.');
        return;
      }

      const output = await vscode.window.showInputBox({
        placeHolder: 'Enter the expected output for the test case',
        prompt: 'Expected output for the test case',
      });

      if (!output || output.trim() === '') {
        vscode.window.showErrorMessage('No output provided or output is empty.');
        return;
      }

      const folderPath = path.join(context.extensionPath, 'testcases');
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const existingTestCases = fs
        .readdirSync(folderPath)
        .filter(file => /^input\d+\.txt$/.test(file)).length;
      const newTestCaseNumber = existingTestCases + 1;

      const inputFilePath = path.join(folderPath, `input${newTestCaseNumber}.txt`);
      const outputFilePath = path.join(folderPath, `output${newTestCaseNumber}.txt`);

      fs.writeFileSync(inputFilePath, input.trim(), 'utf8');
      fs.writeFileSync(outputFilePath, output.trim(), 'utf8');

      vscode.window.showInformationMessage(`Test case ${newTestCaseNumber} added successfully!`);
    } catch (error) {
      console.error('Error adding test case:', error);
      vscode.window.showErrorMessage('Failed to add the test case. Please try again.');
    }
  });

  context.subscriptions.push(addTestCase);
}

exports.activate = activate;


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

// Function to sanitize the extracted text
function sanitizeText(text) {
  // Replace non-breaking spaces with regular spaces
  text = text.replace(/\u00A0/g, " ");
  // Replace smart quotes with regular quotes
  text = text.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  // Optionally, remove any other non-printable characters
  text = text.replace(/[\x00-\x1F\x7F]/g, ""); // Remove control characters
  // Return the sanitized text
  return text;
}

// Function to handle template fetching and test case fetching
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

    const codeTemplate = await page.$$eval('.view-lines .view-line', (lines) =>
      lines.map((line) => line.innerText).join('\n')
    );
    const sanitizedCode = sanitizeText(codeTemplate);
    console.log(sanitizedCode);
const testCases = await page.$$eval('pre', (preElements) => {
  // Create an array to store test case data
  return preElements.map((pre) => {
    const text = pre.innerText.trim();
    
    // Assuming the "Input:" and "Output:" labels are within <strong> tags
    const inputMatch = text.match(/Input:\s*([\s\S]+?)(?=Output:|$)/);
    //const outputMatch = text.match(/Output:\s*([\s\S]+?)(?=Input:|$)/);
    const outputMatch = text.match(/Output:\s*([\s\S]+?)(?=<strong>|Explanation:|$)/);

    const cleanText = (str) => str.replace(/[=+\-*/a-zA-Z!@#$%^&()_{}\[\]:;'"<>?,.~`\\|]/g, ' ').replace(/\s+/g, ' ').trim();

    return {
      input: inputMatch ? cleanText(inputMatch[1]) : '',
      output: outputMatch ? cleanText(outputMatch[1]) : ''
    };
  }).filter(testCase => testCase.input && testCase.output); // Filter out empty test cases
});

// Save test cases
const folderPath = path.join(context.extensionPath, 'testcases');
if (!fs.existsSync(folderPath)) {
  fs.mkdirSync(folderPath);
}

testCases.forEach((testCase, index) => {
  const inputFilePath = path.join(folderPath, `input${index + 1}.txt`);
  const outputFilePath = path.join(folderPath, `output${index + 1}.txt`);
  fs.writeFileSync(inputFilePath, testCase.input, 'utf8');
  fs.writeFileSync(outputFilePath, testCase.output, 'utf8');
});


    // Write the code template based on the selected language
    if (selectedLanguage === 'C++') {
      const codeFilePath = path.join(context.extensionPath, 'code.cpp');
      fs.writeFileSync(codeFilePath, sanitizedCode, 'utf8');
      const document = await vscode.workspace.openTextDocument(codeFilePath);
      await vscode.window.showTextDocument(document);
    } else if (selectedLanguage === 'Python') {
      const pythonTemplate = sanitizedCode.replace('int main', 'def main()');
      const codeFilePath = path.join(context.extensionPath, 'code.py');
      fs.writeFileSync(codeFilePath, pythonTemplate, 'utf8');
      const document = await vscode.workspace.openTextDocument(codeFilePath);
      await vscode.window.showTextDocument(document);
    }

    await browser.close();
  } catch (error) {
    console.error(error);
    vscode.window.showErrorMessage('Failed to fetch test cases and problem template.');
  }
}

exports.activate = activate;
