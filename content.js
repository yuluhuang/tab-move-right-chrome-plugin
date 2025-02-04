// 检测鼠标是否悬浮在标签页上
document.addEventListener("mouseover", (event) => {

    // const isTabArea = event.target.tagName === "BODY"; // 根据你的需求调整检测逻辑
    // chrome.runtime?.sendMessage({ type: "hover", hovering: true });
    // if (isTabArea) {
    //     chrome.runtime.sendMessage({ type: "hover", hovering: true });
    // }
});

document.addEventListener("mouseout", (event) => {

    // const isTabArea = event.target.tagName === "BODY"; // 根据你的需求调整检测逻辑
    // chrome.runtime?.sendMessage({ type: "hover", hovering: false });
    // if (isTabArea) {
    //     chrome.runtime.sendMessage({ type: "hover", hovering: false });
    // }
});
