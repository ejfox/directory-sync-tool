#!/usr/bin/env node

const blessed = require("blessed");
const fs = require("fs");
const path = require("path");
const fse = require("fs-extra");
const { exec, spawn } = require("child_process");
const os = require("os");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

const lore = `
Welcome, netrunner. Your mission: maintain the integrity of the digital vault.
Rogue files disrupt the balance. Eliminate or ignore them as needed.
Embark on your journey by selecting directories to compare.
Press 'e' to uncover hidden knowledge. Begin your operation now.

Press 'q' to quit, 'd' to delete a file, 'i' to ignore a file.
`;

let backgroundMusicProcess;

require("dotenv").config();

const defaultPaths = {
  target:
    process.env.TARGET_PATH ||
    path.join(os.homedir(), "website", "content", "blog"),
  source:
    process.env.SOURCE_PATH ||
    path.join(
      os.homedir(),
      "Library",
      "Mobile Documents",
      "iCloud~md~obsidian",
      "Documents",
      "ejfox"
    ),
};

const cyberSymbols = {
  folder: "[+]",
  file: "[*]",
  select: "⚡",
  back: "<<",
  divider: "▀▄▀▄▀▄",
  truth: "[T]",
  anomaly: "[A]",
  delete: "[X]",
  ignore: "[/]",
  sync: "<-->",
  jackIn: "≈",
};

const cyberLore = {
  source: [
    "Jacking into the source of truth...",
    "Prepare to download the core data nexus.",
    "Truth awaits. Are you ready to plug in?",
    "The digital heartbeat of your reality lies within.",
  ],
  target: [
    "Scanning for anomalies in the target zone...",
    "Prepare to breach the corrupted data streams.",
    "Anomalies detected. Initiate synchronization?",
    "Target locked. Ready to neutralize discrepancies.",
  ],
};

function playSound(filePath) {
  const command = process.platform === "darwin" ? "afplay" : "mpg123";
  exec(`${command} ${filePath}`, (error) => {
    if (error) console.error("Error playing sound:", error);
  });
}

function playBackgroundMusic(filePath) {
  const command = process.platform === "darwin" ? "afplay" : "mpg123";
  const args =
    process.platform === "darwin"
      ? [filePath, "-v", "0.25"]
      : ["-f", "8192", filePath];
  backgroundMusicProcess = spawn(command, args);
  backgroundMusicProcess.on("error", (error) =>
    console.error("Error playing background music:", error)
  );
}

function stopBackgroundMusic() {
  if (backgroundMusicProcess) {
    backgroundMusicProcess.kill();
    backgroundMusicProcess = null;
  }
}

function displayEasterEgg(differences, screen) {
  let i = 0;
  const interval = setInterval(() => {
    if (i >= differences.length) {
      clearInterval(interval);
      return;
    }
    const box = blessed.box({
      top: Math.random() * (screen.height - 3),
      left: Math.random() * (screen.width - differences[i].length),
      width: differences[i].length,
      height: 1,
      content: differences[i],
      style: { fg: "red", bg: "black" },
    });
    screen.append(box);
    screen.render();
    i++;
  }, 100);
  playSound("sounds/easter_egg.wav");
}

function createFileSelector(screen, startPath, type, callback) {
  const title =
    type === "source"
      ? `${cyberSymbols.select} SELECT SOURCE: 🌐 Where the Truth Resides ${cyberSymbols.select}`
      : `${cyberSymbols.anomaly} SELECT TARGET: 🎯 Where Anomalies Lurk ${cyberSymbols.anomaly}`;

  const fileList = blessed.list({
    parent: screen,
    width: "70%",
    height: "60%",
    top: "20%",
    left: "center",
    align: "left",
    keys: true,
    vi: true,
    mouse: true,
    border: {
      type: "line",
      fg: type === "source" ? "blue" : "red",
    },
    scrollbar: {
      ch: "║",
      track: {
        bg: type === "source" ? "blue" : "red",
      },
      style: {
        inverse: true,
      },
    },
    style: {
      item: {
        hover: {
          bg: type === "source" ? "blue" : "red",
        },
      },
      selected: {
        bg: type === "source" ? "blue" : "red",
        bold: true,
      },
    },
  });

  const titleBox = blessed.box({
    parent: screen,
    top: "10%",
    left: "center",
    width: "100%",
    height: 3,
    content: title,
    style: {
      fg: type === "source" ? "blue" : "red",
      bg: "black",
      bold: true,
    },
    align: "center",
  });

  const currentPathBox = blessed.box({
    parent: screen,
    top: "15%",
    left: "center",
    width: "90%",
    height: 3,
    content: "",
    style: {
      fg: "yellow",
      bg: "black",
    },
    align: "center",
  });

  const infoBox = blessed.box({
    parent: screen,
    bottom: "15%",
    left: "center",
    width: "100%",
    height: 3,
    content: "",
    style: {
      fg: "cyan",
      bg: "black",
    },
    align: "center",
  });

  const updateInfoBox = () => {
    const lore = cyberLore[type];
    const randomLore = lore[Math.floor(Math.random() * lore.length)];
    infoBox.setContent(
      `${cyberSymbols.divider}\n${randomLore}\n${cyberSymbols.divider}`
    );
  };

  const updateFileList = (directory) => {
    currentPathBox.setContent(`Current Path: ${directory}`);

    try {
      const files = fs.readdirSync(directory).map((file) => {
        const filePath = path.join(directory, file);
        const isDirectory = fs.statSync(filePath).isDirectory();
        return {
          name: `${
            isDirectory ? cyberSymbols.folder : cyberSymbols.file
          } ${file}`,
          path: filePath,
          isDirectory,
        };
      });

      files.unshift({
        name: `${cyberSymbols.jackIn} SELECT CURRENT DIRECTORY`,
        path: directory,
        isDirectory: true,
        isCurrent: true,
      });

      if (directory !== path.parse(directory).root) {
        files.unshift({
          name: `${cyberSymbols.back} PARENT DIRECTORY`,
          path: path.join(directory, ".."),
          isDirectory: true,
        });
      }

      fileList.setItems(files.map((file) => file.name));
      fileList.select(0);
      updateInfoBox();
    } catch (error) {
      handleError(error, `Failed to read directory: ${directory}`);
    }
  };

  updateFileList(startPath);

  fileList.on("select", (item, index) => {
    const selectedItem = fileList.items[index];
    const itemPath = selectedItem.path;

    if (selectedItem.isCurrent) {
      screen.remove(fileList);
      screen.remove(infoBox);
      screen.remove(titleBox);
      screen.remove(currentPathBox);
      screen.remove(instructions);
      callback(itemPath);
    } else if (selectedItem.isDirectory) {
      updateFileList(itemPath);
    }
  });

  const instructions = blessed.box({
    parent: screen,
    bottom: "5%",
    left: "center",
    width: "100%",
    height: 5,
    content: `${cyberSymbols.select} NAVIGATE: Arrow Keys | SELECT: Enter
${cyberSymbols.jackIn} SELECT CURRENT DIR: Choose "${cyberSymbols.jackIn} SELECT CURRENT DIRECTORY"
EXIT: Esc`,
    style: {
      fg: "green",
      bg: "black",
    },
    align: "center",
  });

  fileList.key(["escape"], () => {
    screen.remove(fileList);
    screen.remove(infoBox);
    screen.remove(titleBox);
    screen.remove(currentPathBox);
    screen.remove(instructions);
    callback(null);
  });

  screen.key(["C-c"], () => process.exit(0));

  screen.append(fileList);
  screen.append(infoBox);
  screen.append(titleBox);
  screen.append(currentPathBox);
  screen.append(instructions);
  fileList.focus();
  screen.render();
}

function getDirectories(screen, callback) {
  let directories = {};

  const selectDirectory = (type) => {
    const startPath = defaultPaths[type] || os.homedir();
    createFileSelector(screen, startPath, type, (selectedPath) => {
      if (selectedPath) {
        directories[type] = selectedPath;
        if (type === "source") {
          selectDirectory("target");
        } else {
          callback(directories);
        }
      } else {
        // If no path is selected (user pressed Esc), go back to the previous selection
        if (type === "target" && directories.source) {
          selectDirectory("source");
        } else {
          // If we're already at source or no directories selected, exit the tool
          stopBackgroundMusic();
          console.clear();
          process.exit(0);
        }
      }
    });
  };

  selectDirectory("source");
}

function compareDirectories(sourceDir, targetDir) {
  const sourceFiles = new Set(fs.readdirSync(sourceDir));
  const targetFiles = new Set(fs.readdirSync(targetDir));
  return Array.from(targetFiles).filter((file) => !sourceFiles.has(file));
}

function startSyncTool(screen, directories) {
  const { source: sourceDir, target: targetDir } = directories;
  const differences = compareDirectories(sourceDir, targetDir);

  const list = blessed.list({
    top: "20%",
    left: "center",
    width: "100%",
    height: "60%",
    items:
      differences.length > 0
        ? differences.map((file) => {
            const anomaly = `${cyberSymbols.anomaly} ANOMALY DETECTED: "${file}"`;
            const action = `Actions: 'd' to delete, 'i' to ignore`;
            return `${anomaly} (Source Only)\n${action}`;
          })
        : ["SYNC COMPLETE - No anomalies detected."],
    keys: true,
    vi: true,
    style: {
      fg: "white",
      bg: "black",
      selected: { fg: "black", bg: "cyan" },
    },
  });

  const syncTitle = blessed.box({
    parent: screen,
    top: "5%",
    left: "center",
    width: "100%",
    height: 3,
    content: `${cyberSymbols.truth} vs ${cyberSymbols.anomaly} - Synchronization Interface`,
    style: {
      fg: "cyan",
      bg: "black",
      bold: true,
    },
    align: "center",
  });

  const syncInstructions = blessed.box({
    parent: screen,
    bottom: "5%",
    left: "center",
    width: "100%",
    height: 3,
    content: `'d': ${cyberSymbols.delete} Anomaly | 'i': ${cyberSymbols.ignore} Anomaly | 'q': Quit | 'e': Easter Egg
    Available actions are displayed above. Select an anomaly and choose your action, netrunner.`,
    style: {
      fg: "green",
      bg: "black",
    },
    align: "center",
  });

  screen.append(list);
  screen.append(syncTitle);
  screen.append(syncInstructions);
  list.focus();

  const actions = {
    d: () => {
      const selected = list.getItem(list.selected).content;
      if (selected !== "SYNC COMPLETE - No anomalies detected.") {
        const fileName = selected.match(/"([^"]+)"/)[1];
        fse.removeSync(path.join(targetDir, fileName));
        list.removeItem(list.selected);
        playSound("sounds/delete.wav");
        screen.append(
          blessed.box({
            top: "center",
            left: "center",
            width: "50%",
            height: 3,
            content: `${cyberSymbols.delete} Anomaly Removed: "${fileName}" has been eliminated.`,
            style: { fg: "red", bg: "black" },
            border: { type: "line" },
          })
        );
        setTimeout(
          () => screen.remove(screen.children[screen.children.length - 1]),
          2000
        );
      }
    },
    // Inside the 'actions' object, modify the 'i' key function
    i: () => {
      const fileName = selected.match(/"([^"]+)"/)[1];
      list.removeItem(list.selected);
      playSound("sounds/ignore.wav");
      screen.append(
        blessed.box({
          top: "center",
          left: "center",
          width: "50%",
          height: 3,
          content: `${cyberSymbols.ignore} Anomaly Ignored: "${fileName}" has been ignored.`,
          style: { fg: "yellow", bg: "black" },
          border: { type: "line" },
        })
      );
      setTimeout(
        () => screen.remove(screen.children[screen.children.length - 1]),
        2000
      );

      // Check if the list is empty after removing an item
      if (list.items.length === 0) {
        // Display success screen
        const successScreen = blessed.box({
          top: "center",
          left: "center",
          width: "75%",
          height: "shrink",
          content:
            "Success! All anomalies have been handled. Shutting down in 10 seconds...",
          style: { fg: "green", bg: "black" },
          border: { type: "line" },
        });
        screen.append(successScreen);
        screen.render();

        // Set a timeout for auto-shutdown
        setTimeout(() => {
          stopBackgroundMusic();
          console.clear();
          process.exit(0);
        }, 10000); // 10 seconds
      }
    },
    q: () => process.exit(0),
    e: () => {
      playSound("sounds/easter_egg.wav");
      displayEasterEgg(differences, screen);
    },
  };

  list.key(["d", "i", "q", "e"], (ch) => {
    actions[ch]();
    screen.render();
  });

  screen.render();
}

function handleError(error, message) {
  console.error(`Error: ${message}`);
  console.error(error);
  process.exit(1);
}

function validateDirectory(dir) {
  try {
    fs.accessSync(dir, fs.constants.R_OK);
    return fs.statSync(dir).isDirectory();
  } catch (error) {
    return false;
  }
}

function runTool(argv) {
  const screen = blessed.screen({
    smartCSR: true,
    title: "Directory Sync Tool",
  });

  screen.key(["C-c"], () => {
    stopBackgroundMusic();
    console.clear();
    process.exit(0);
  });

  process.on("exit", () => {
    stopBackgroundMusic();
    console.clear();
  });

  blessed.box({
    bottom: 0,
    left: "center",
    width: "100%",
    height: "shrink",
    content: lore,
    tags: true,
    style: { fg: "yellow", bg: "black" },
  });

  playBackgroundMusic("sounds/background.wav");

  const loading = blessed.loading({
    parent: screen,
    top: "center",
    left: "center",
    border: "line",
    height: 3,
    width: "50%",
    label: "Loading...",
    tags: true,
    style: { border: { fg: "cyan" }, fg: "cyan" },
  });

  loading.load("Initializing...");
  screen.append(loading);
  screen.render();

  setTimeout(() => {
    loading.stop();
    screen.remove(loading);
    if (argv.source && argv.target) {
      if (!validateDirectory(argv.source) || !validateDirectory(argv.target)) {
        handleError(null, "Invalid source or target directory.");
      }
      screen.destroy();
      const newScreen = blessed.screen({
        smartCSR: true,
        title: "Directory Sync Tool",
      });
      startSyncTool(newScreen, { source: argv.source, target: argv.target });
    } else {
      getDirectories(screen, (directories) => {
        screen.destroy();
        const newScreen = blessed.screen({
          smartCSR: true,
          title: "Directory Sync Tool",
        });
        startSyncTool(newScreen, directories);
      });
    }
  }, 500);
}

function main() {
  const argv = yargs(hideBin(process.argv))
    .usage("Usage: $0 [options]")
    .option("source", {
      alias: "s",
      describe: "Source directory path",
      type: "string",
    })
    .option("target", {
      alias: "t",
      describe: "Target directory path",
      type: "string",
    })
    .help("h")
    .alias("h", "help")
    .version("v", "Show version information", "1.0.0")
    .alias("v", "version")
    .example(
      "$0 -s /path/to/source -t /path/to/target",
      "Run the tool with specified source and target directories"
    ).argv;

  runTool(argv);
}

main();
