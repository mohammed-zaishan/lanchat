const socket = io();

const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const attachButton = document.getElementById("attachButton");
const fileInput = document.getElementById("fileInput");
const selectedFileInfo = document.getElementById("selectedFileInfo");
const emptyState = document.getElementById("emptyState");
const sendButton = document.getElementById("sendButton");

const uploadProgress = document.getElementById("uploadProgress");
const uploadProgressFill = document.getElementById("uploadProgressFill");
const uploadProgressText = document.getElementById("uploadProgressText");
const uploadProgressLabel = document.getElementById("uploadProgressLabel");

const userListEl = document.getElementById("userList");
const groupListEl = document.getElementById("groupList");
const onlineCountEl = document.getElementById("onlineCount");
const publicChatItem = document.getElementById("publicChatItem");
const newGroupButton = document.getElementById("newGroupButton");

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

const currentUserAvatar = document.getElementById("currentUserAvatar");
const avatarInitials = document.getElementById("avatarInitials");

function applyTheme(theme) {
  const root = document.documentElement;

  if (theme === "light") {
    root.setAttribute("data-theme", "light");
    if (themeIcon) themeIcon.textContent = "dark_mode";
  } else {
    root.removeAttribute("data-theme");
    if (themeIcon) themeIcon.textContent = "light_mode";
  }

  try {
    localStorage.setItem("lanChatTheme", theme);
  } catch (e) {
    console.error(e);
  }
}

function initTheme() {
  let saved = "dark";
  try {
    saved = localStorage.getItem("lanChatTheme") || "dark";
  } catch (e) {}

  applyTheme(saved);
}

initTheme();

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const isLight =
      document.documentElement.getAttribute("data-theme") === "light";
    applyTheme(isLight ? "dark" : "light");
  });
}

const currentUser = {
  id: null,
  name: null,
  deviceName: null,
};

let onlineUsers = [];
let myGroups = {};
const conversations = {
  public: [],
  dm: {},
  group: {},
};

const ChatType = {
  PUBLIC: "public",
  DM: "dm",
  GROUP: "group",
};

let activeChat = {
  type: ChatType.PUBLIC,
  targetId: null,
};

function showUploadProgress() {
  if (!uploadProgress) return;
  uploadProgress.hidden = false;
  uploadProgressFill.style.width = "0%";
  uploadProgressText.textContent = "0%";
  uploadProgressLabel.textContent = "Uploading…";
}

function updateUploadProgress(percent) {
  if (!uploadProgress) return;
  const clamped = Math.min(100, Math.max(0, percent));
  uploadProgressFill.style.width = clamped + "%";
  uploadProgressText.textContent = clamped + "%";
}

function hideUploadProgress(success = true) {
  if (!uploadProgress) return;
  if (success) {
    uploadProgressLabel.textContent = "Upload complete";
    uploadProgressText.textContent = "100%";
    setTimeout(() => {
      uploadProgress.hidden = true;
    }, 600);
  } else {
    uploadProgressLabel.textContent = "Upload failed";
    uploadProgressText.textContent = "";
    setTimeout(() => {
      uploadProgress.hidden = true;
    }, 1300);
  }
}

function hideEmptyState() {
  if (emptyState) {
    emptyState.style.display = "none";
  }
}

function clearMessages() {
  messages.innerHTML = "";
}

function scrollToBottom() {
  messages.scrollTop = messages.scrollHeight;
}

function createMessageElement(msg) {
  const row = document.createElement("div");
  row.className = "message-row";

  const bubble = document.createElement("div");
  bubble.className = "message" + (msg.isFile ? " file" : "");

  if (msg.from && msg.from.id === currentUser.id) {
    bubble.classList.add("self");
  }

  const header = document.createElement("div");
  header.className = "message-header";

  const nameSpan = document.createElement("span");
  nameSpan.textContent = msg.from ? msg.from.name || "Unknown" : "Unknown";

  const scopeSpan = document.createElement("span");
  scopeSpan.className = "message-header-scope";
  if (msg.scope === ChatType.DM) {
    scopeSpan.textContent = "DM";
  } else if (msg.scope === ChatType.GROUP) {
    scopeSpan.textContent = "Group";
  } else {
    scopeSpan.textContent = "General";
  }

  header.appendChild(nameSpan);
  header.appendChild(scopeSpan);

  bubble.appendChild(header);

  if (msg.isFile && msg.fileData) {
    const fileRow = document.createElement("div");
    fileRow.className = "message-file-row";

    const icon = document.createElement("span");
    icon.className = "material-icons message-file-icon";
    icon.textContent = "attach_file";

    const link = document.createElement("a");
    link.href = msg.fileData.fileUrl;
    link.target = "_blank";
    link.download = msg.fileData.fileName;
    link.textContent = msg.fileData.fileName;

    fileRow.appendChild(icon);
    fileRow.appendChild(link);
    bubble.appendChild(fileRow);
  } else {
    const body = document.createElement("div");
    body.className = "message-body";
    body.textContent = msg.text;
    bubble.appendChild(body);
  }

  row.appendChild(bubble);
  return row;
}

function appendMessage(msg) {
  hideEmptyState();
  const el = createMessageElement(msg);
  messages.appendChild(el);
  scrollToBottom();
}

function renderConversation() {
  clearMessages();
  let list = [];
  if (activeChat.type === ChatType.PUBLIC) {
    list = conversations.public;
  } else if (activeChat.type === ChatType.DM) {
    list = conversations.dm[activeChat.targetId] || [];
  } else if (activeChat.type === ChatType.GROUP) {
    list = conversations.group[activeChat.targetId] || [];
  }

  if (!list.length) {
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  list.forEach((msg) => {
    const el = createMessageElement(msg);
    messages.appendChild(el);
  });
  scrollToBottom();
}

function renderUserList() {
  if (!userListEl) return;
  userListEl.innerHTML = "";

  onlineUsers.forEach((user) => {
    const isSelf = user.id === currentUser.id;

    if (isSelf) {
      // don't show this device in the sidebar
      return;
    }

    const item = document.createElement("div");
    item.className = "sidebar-item" + (isSelf ? " sidebar-item--self" : "");
    item.dataset.chatType = ChatType.DM;
    item.dataset.userId = user.id;

    const icon = document.createElement("span");
    icon.className = "material-icons sidebar-item-icon";
    icon.textContent = isSelf ? "person" : "person_outline";

    const textWrap = document.createElement("div");
    textWrap.className = "sidebar-item-text";

    const title = document.createElement("div");
    title.className = "sidebar-item-title";
    title.textContent = user.name;

    const subtitle = document.createElement("div");
    subtitle.className = "sidebar-item-subtitle";
    subtitle.textContent = isSelf ? "This device" : user.deviceName || "Device";

    textWrap.appendChild(title);
    textWrap.appendChild(subtitle);

    item.appendChild(icon);
    item.appendChild(textWrap);

    if (!isSelf) {
      item.addEventListener("click", () => {
        setActiveChat(ChatType.DM, user.id, item);
      });
    }

    userListEl.appendChild(item);
  });

  if (onlineCountEl) {
    onlineCountEl.textContent = onlineUsers.length.toString();
  }
}

function renderGroupList() {
  if (!groupListEl) return;
  groupListEl.innerHTML = "";

  Object.values(myGroups).forEach((group) => {
    if (!group.members || !group.members.includes(currentUser.id)) return;

    const item = document.createElement("div");
    item.className = "sidebar-item";
    item.dataset.chatType = ChatType.GROUP;
    item.dataset.groupId = group.id;

    const icon = document.createElement("span");
    icon.className = "material-icons sidebar-item-icon";
    icon.textContent = "group";

    const textWrap = document.createElement("div");
    textWrap.className = "sidebar-item-text";

    const title = document.createElement("div");
    title.className = "sidebar-item-title";
    title.textContent = group.name || group.id;

    const subtitle = document.createElement("div");
    subtitle.className = "sidebar-item-subtitle";
    subtitle.textContent = "Group chat";

    textWrap.appendChild(title);
    textWrap.appendChild(subtitle);

    item.appendChild(icon);
    item.appendChild(textWrap);

    item.addEventListener("click", () => {
      setActiveChat(ChatType.GROUP, group.id, item);
    });

    groupListEl.appendChild(item);
  });
}

function clearActiveSidebar() {
  document
    .querySelectorAll(".sidebar-item")
    .forEach((el) => el.classList.remove("sidebar-item--active"));
}

function setActiveChat(type, targetId, clickedItem) {
  activeChat.type = type;
  activeChat.targetId = targetId || null;

  clearActiveSidebar();
  if (clickedItem) {
    clickedItem.classList.add("sidebar-item--active");
  } else if (publicChatItem && type === ChatType.PUBLIC) {
    publicChatItem.classList.add("sidebar-item--active");
  }

  renderConversation();
}

socket.on("connect", () => {
  currentUser.id = socket.id;

  const storedName = window.localStorage.getItem("lanChatName") || "";
  const storedDevice = window.localStorage.getItem("lanChatDevice") || "";

  const name =
    storedName ||
    prompt("Enter a display name for LAN chat:", "User") ||
    "User";
  const deviceName = storedDevice || navigator.platform || "My device";

  currentUser.name = name;
  currentUser.deviceName = deviceName;

  window.localStorage.setItem("lanChatName", currentUser.name);
  window.localStorage.setItem("lanChatDevice", currentUser.deviceName);

  socket.emit("register", {
    name: currentUser.name,
    deviceName: currentUser.deviceName,
  });

  updateCurrentUserAvatar();
});

socket.on("users:update", (users) => {
  onlineUsers = users;
  renderUserList();
});

socket.on("group:update", (group) => {
  myGroups[group.id] = group;
  renderGroupList();
});

socket.on("chat message", (payload) => {
  let text;
  let from = null;

  if (typeof payload === "string") {
    text = payload;
  } else {
    text = payload.text;
    from = payload.from || null;
  }

  const msg = {
    text,
    from,
    scope: ChatType.PUBLIC,
    isFile: false,
    fileData: null,
    timestamp: Date.now(),
  };

  conversations.public.push(msg);
  if (activeChat.type === ChatType.PUBLIC) {
    appendMessage(msg);
  }
});

socket.on("private message", (payload) => {
  const { from, to, text } = payload;

  const peerId = from.id === currentUser.id ? to : from.id;

  const msg = {
    text,
    from,
    scope: ChatType.DM,
    isFile: false,
    fileData: null,
    timestamp: Date.now(),
  };

  if (!conversations.dm[peerId]) {
    conversations.dm[peerId] = [];
  }
  conversations.dm[peerId].push(msg);

  if (activeChat.type === ChatType.DM && activeChat.targetId === peerId) {
    appendMessage(msg);
  }
});

socket.on("file message", (payload) => {
  const { from, fileUrl, fileName, private: isPrivate, to } = payload;
  let scope = ChatType.PUBLIC;
  let key = null;

  if (isPrivate) {
    scope = ChatType.DM;
    const peerId = from.id === currentUser.id ? to : from.id;
    key = peerId;
    if (!conversations.dm[key]) conversations.dm[key] = [];
  } else {
    scope = ChatType.PUBLIC;
  }

  const msg = {
    text: "",
    from,
    scope,
    isFile: true,
    fileData: { fileUrl, fileName },
    timestamp: Date.now(),
  };

  if (scope === ChatType.PUBLIC) {
    conversations.public.push(msg);
    if (activeChat.type === ChatType.PUBLIC) appendMessage(msg);
  } else if (scope === ChatType.DM) {
    conversations.dm[key].push(msg);
    if (activeChat.type === ChatType.DM && activeChat.targetId === key) {
      appendMessage(msg);
    }
  }
});

socket.on("group message", (payload) => {
  const { from, groupId, text } = payload;

  if (!conversations.group[groupId]) {
    conversations.group[groupId] = [];
  }

  const msg = {
    text,
    from,
    scope: ChatType.GROUP,
    isFile: false,
    fileData: null,
    timestamp: Date.now(),
  };

  conversations.group[groupId].push(msg);

  if (activeChat.type === ChatType.GROUP && activeChat.targetId === groupId) {
    appendMessage(msg);
  }
});

form.addEventListener("submit", function (e) {
  e.preventDefault();
  const value = input.value.trim();
  if (!value) return;

  if (activeChat.type === ChatType.PUBLIC) {
    socket.emit("chat message", value);
  } else if (activeChat.type === ChatType.DM) {
    socket.emit("private message", {
      to: activeChat.targetId,
      text: value,
    });
  } else if (activeChat.type === ChatType.GROUP) {
    socket.emit("group message", {
      groupId: activeChat.targetId,
      text: value,
    });
  }

  input.value = "";
  input.style.height = "34px";
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 120) + "px";
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.dispatchEvent(new Event("submit"));
  }
});

attachButton.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) {
    selectedFileInfo.textContent = "";
    return;
  }

  selectedFileInfo.innerHTML = `
    <span class="file-pill">
      <span class="material-icons">attach_file</span>
      <span class="filename">${file.name}</span>
      <button type="button" id="clearFile" title="Remove file">
        <span class="material-icons">close</span>
      </button>
    </span>
  `;

  document.getElementById("clearFile").addEventListener("click", () => {
    fileInput.value = "";
    selectedFileInfo.textContent = "";
  });

  const formData = new FormData();
  formData.append("file", file);

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/upload");

  sendButton.disabled = true;
  showUploadProgress();

  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      const percent = Math.round((event.loaded / event.total) * 100);
      updateUploadProgress(percent);
    } else {
      uploadProgressLabel.textContent = "Uploading…";
    }
  };

  xhr.onload = () => {
    sendButton.disabled = false;

    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const result = JSON.parse(xhr.responseText);

        const payload = {
          fileUrl: result.fileUrl,
          fileName: result.originalName,
        };

        if (activeChat.type === ChatType.DM) {
          payload.to = activeChat.targetId;
        }

        socket.emit("file message", payload);

        fileInput.value = "";
        selectedFileInfo.textContent = "";
        hideUploadProgress(true);
      } catch (e) {
        console.error("Failed to parse upload response", e);
        selectedFileInfo.innerHTML =
          '<span style="color: var(--md-error);">Upload error (bad response)</span>';
        hideUploadProgress(false);
      }
    } else {
      console.error("Upload failed with status", xhr.status);
      selectedFileInfo.innerHTML =
        '<span style="color: var(--md-error);">Upload failed</span>';
      hideUploadProgress(false);
    }
  };

  xhr.onerror = () => {
    sendButton.disabled = false;
    console.error("Network error during upload");
    selectedFileInfo.innerHTML =
      '<span style="color: var(--md-error);">Network error during upload</span>';
    hideUploadProgress(false);
  };

  xhr.send(formData);
});

if (publicChatItem) {
  publicChatItem.addEventListener("click", () => {
    setActiveChat(ChatType.PUBLIC, null, publicChatItem);
  });
}

if (newGroupButton) {
  newGroupButton.addEventListener("click", () => {
    const name = prompt("Group name:");
    if (!name) return;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const groupId = `${slug}-${Date.now().toString(36)}`;

    socket.emit("group join", { groupId, name });

    setActiveChat(ChatType.GROUP, groupId, null);
  });
}

function getInitialsFromName(name) {
  if (!name) return "?";
  const trimmed = name.trim();

  const parts = trimmed.split(/[\s\-_]+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function updateCurrentUserAvatar() {
  if (!currentUserAvatar || !avatarInitials) return;
  const initials = getInitialsFromName(
    currentUser.deviceName || currentUser.name
  );
  avatarInitials.textContent = initials;
  currentUserAvatar.title = currentUser.deviceName || currentUser.name;
}
