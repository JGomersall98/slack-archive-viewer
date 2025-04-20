# Slack Archive Viewer

A local viewer for exploring exported Slack conversations — including public channels and direct messages.

---

## 🚀 Getting Started

### 1. Prepare Your Slack Export

Unzip all of your exported Slack channel and direct message folders. Then, place all of the unzipped folders into a directory named `data` in the root of this project.

Make sure the `data` folder is at the top level of the project alongside folders like `app`, `components`, etc.

The structure for the data folder is as followed, with the raw dump files.

`data/<some export folder>/<random dump name folder>/<.json files>` (you should not need to alter this)

---

### 2. Start the Application

Open a terminal, navigate to the root of the project, and run: npm run prd


### 💡 Tip: Windows Users – Create a `.bat` Startup Script

To make startup even easier, create a `.bat` file like this:

```bat
cd /d "C:\path\to\slack-archive-viewer"
npm run prd
start http://localhost:3000
