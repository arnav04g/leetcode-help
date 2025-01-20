# LeetCode Help VS Code Extension

## Overview
"LeetCode Help" is a Visual Studio Code extension designed to simplify the process of solving LeetCode problems by providing features to fetch problem templates, manage test cases, and run test cases directly within the editor. This extension integrates seamlessly with the VS Code environment, enabling users to focus on coding and problem-solving without switching between tools or browsers.

### Video Demonstration
For a quick demonstration of the extension's features, refer to this [YouTube video](https://youtu.be/gorMJl7TobU?feature=shared).

---

## Features

### 1. **Fetch Test Cases**
- A status bar button labeled `$(cloud-download) Fetch Test Cases` is available to scrape problem templates and test cases directly from a LeetCode problem URL.
- **Steps to Use:**
  1. Click the "Fetch Test Cases" button.
  2. Enter the LeetCode problem URL in the input box.
  3. Select the programming language (C++ or Python) from the webview popup.
  4. The extension fetches the problem template and test cases, storing them locally for further use.

### 2. **Run Test Cases**
- A status bar button labeled `$(play) Run Test Cases` allows users to run their solution against the fetched test cases.
- The extension automatically detects whether the solution is in C++ or Python.
- Compiles and runs C++ code or executes Python code against the input test cases.
- Compares the actual output against the expected output and provides a result for each test case (Passed/Failed).

### 3. **Add Custom Test Cases**
- A status bar button labeled `$(add) Add Test Case` is available to add custom test cases manually.
- **Steps to Add:**
  1. Enter the input for the test case in the provided input box.
  2. Enter the expected output in the next input box.
  3. The test case is saved locally for execution.

### 4. **Language Support**
- Supports both C++ and Python.
- Automatically detects the language based on the template fetched and the files present locally.

### 5. **Web Scraping with Puppeteer**
- The extension uses Puppeteer to scrape problem templates and test cases from the LeetCode website.
- Scraped templates are sanitized and saved in appropriate files (`code.cpp` or `code.py`).

---

## Installation
1. Clone this repository to your local machine.
2. Open the folder in VS Code.
3. Run `npm install` to install the dependencies.
4. Press `F5` to launch the extension in the development host.
5. Install the extension in your VS Code.

---

## Usage Guide

### Fetching Test Cases
1. Click on the `$(cloud-download) Fetch Test Cases` button in the status bar.
2. Enter the URL of the LeetCode problem in the input box.
3. Select your preferred language (C++/Python) from the popup.
4. The extension will:
   - Scrape the problem template and test cases.
   - Save the problem template as `code.cpp` or `code.py`.
   - Save test cases in the `testcases` folder as `inputX.txt` and `outputX.txt`.

### Running Test Cases
1. Click on the `$(play) Run Test Cases` button in the status bar.
2. The extension will:
   - Detect the solution file (`code.cpp` or `code.py`).
   - Compile (for C++) and run the solution against all available test cases.
   - Compare outputs and display results in the VS Code editor.

### Adding Custom Test Cases
1. Click on the `$(add) Add Test Case` button in the status bar.
2. Provide the input and expected output when prompted.
3. The extension will:
   - Save the input as `inputX.txt` and the output as `outputX.txt` in the `testcases` folder.

---

## File Structure
```
project-root/
├── testcases/
│   ├── input1.txt
│   ├── output1.txt
│   ├── input2.txt
│   ├── output2.txt
├── code.cpp (or code.py)
├── extension.js
└── package.json
```

---

## Dependencies
- **fs**: For file system operations.
- **path**: For working with file paths.
- **vscode**: For building VS Code extensions.
- **puppeteer**: For web scraping LeetCode problems.
- **child_process**: For running and compiling test cases.

---

## Contributing
1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Commit your changes and push to your fork.
4. Submit a pull request.

---

## License
This project is licensed under the MIT License.

---

## Troubleshooting
- **Puppeteer Issues:**
  - Ensure Google Chrome is installed.
  - If Puppeteer fails to launch, try adding the `--no-sandbox` flag to the Puppeteer launch options.

- **C++ Compilation Errors:**
  - Ensure `g++` is installed and added to your system's PATH.

- **Python Execution Issues:**
  - Ensure Python is installed and added to your system's PATH.

For additional support, refer to the video demonstration [here](https://youtu.be/gorMJl7TobU?feature=shared).

