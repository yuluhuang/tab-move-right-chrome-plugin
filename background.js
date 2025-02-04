let rightList = []
let isMouseHovering = false;
let _activeInfo = ''
let moveList = []
const moveTimeouts = {}; // 用 tabId 存储超时 ID

// 监听内容脚本发来的悬浮事件
chrome.runtime.onMessage.addListener((message, sender) => {
    /*if (message.type === "hover") {
        isMouseHovering = message.hovering;

        // if (isMouseHovering && _activeInfo) {
        //     console.log(`Mouse hovering: ${isMouseHovering}`);
        //     console.log('message', message, message.type)
        //     let activeInfo = _activeInfo
        //     _activeInfo = ''
        //     move(activeInfo)
        // }
    }*/
});
function updateRightList(_tabs, fixedTabs) {
    rightList = [];
    const totalTabs = _tabs.length;
    for (let i = 0; i < fixedTabs; i++) {
        rightList.push(_tabs[totalTabs - 1 - i].id);
    }
    console.log('Updated rightList:', rightList.join(','));
}
function setTabMoveTimeout(tabId, callback, delay) {
    if (moveTimeouts[tabId]) {
        clearTimeout(moveTimeouts[tabId]);
    }
    moveTimeouts[tabId] = setTimeout(() => {
        callback();
        delete moveTimeouts[tabId];
    }, delay);
}

function move (activeInfo) {
    chrome.tabs.query({}, (tabs) => {

        chrome.storage.sync.get(['delay', 'fixedTabs', 'afterMove', 'open', 'interval'], (data) => {
            console.log('sync', data)
            if (!data.open) {
                return
            }
            // interval = 1， 将上 1个 tab进行右移
            if (data.afterMove) {
                if (moveList.length > data.interval) {
                    moveList = []
                } else if (moveList.length === data.interval) {
                    if (!moveList.find(v => v.tabId === activeInfo.tabId)) {
                        moveList.push(activeInfo) // 加入第二个
                        activeInfo = moveList.shift() // 第一个取出，第二个变成第一个
                    } else {
                        return
                    }
                } else {
                    if (!moveList.find(v => v.tabId === activeInfo.tabId)) {
                        moveList.push(activeInfo) // 加入第二个
                    }
                }
            }

            console.log('moveList', moveList)
            const activeTabIndex = activeInfo.tabId;
            const windowId = activeInfo.windowId;
            const _tabs = tabs.filter(_tab => _tab.windowId === windowId)

            // let logList= []
            // tabs.forEach(v => {
            //     logList.push(v.id)
            // })
            // console.log(logList.join(','))
            // 右边固定tab 或者 移动数没有满 或者 点击的是固定tab，不触发移动
            if (rightList.indexOf(activeTabIndex) !== -1 || (moveList.length > 0 && ((data.afterMove && moveList.length !== data.interval) || rightList.indexOf(moveList[moveList.length - 1].tabId) !== -1))) {
                return
            }
            console.log('activeTabIndex', activeTabIndex, activeInfo)


            const delay = (data.delay > 0 ? data.delay : 0.1) * 1000; // 转换为毫秒
            const fixedTabs = data.fixedTabs; // 默认右边不可移动标签数

            // 确保只有在当前 tab 不是最后一个时才进行右移
            if (activeTabIndex !== tabs.length - 1 && fixedTabs > 0 && _tabs.length > fixedTabs) {

                if (rightList.length !== fixedTabs) {
                    updateRightList(_tabs, fixedTabs);
                    return
                } else {
                    rightList = []
                    for (let i = 0; i < fixedTabs - 1; i++) {
                        rightList.push(_tabs[_tabs.length - 1 - i].id)
                    }
                    rightList.push(activeTabIndex)
                }
                console.log('rightList', rightList.join(','))
                console.log(`Moving tab ${activeTabIndex} to the far right`);
            }
            // 获取用户设置的延迟时间
            setTabMoveTimeout(activeTabIndex, () => {
                // 尝试移动标签页，并捕获可能的错误
                chrome.tabs.move(activeTabIndex, {index: tabs.length})
                    .catch((error) => {
                        if (error.message) {
                            console.log(error.message);
                            setTabMoveTimeout(activeTabIndex, () => {
                                chrome.tabs.move(activeTabIndex, {index: tabs.length});
                            }, 100); // 延迟 100 毫秒重试
                        }
                    });
            }, delay)
            chrome.tabs.onMoved.addListener(() => {
                clearTimeout(moveTimeouts[activeTabIndex]); // 如果标签页已移动，取消等待
            });
        });

    });
}


chrome.tabs.onZoomChange.addListener((activeInfo) => {
    // console.log('onZoomChange', activeInfo)
})
// 监听标签页点击事件
chrome.tabs.onActivated.addListener((activeInfo) => {

    chrome.storage.sync.get(['excludedDomains'], (data) => {
        const excludedDomains = data.excludedDomains || [];
        chrome.tabs.get(activeInfo.tabId, (tab) => {
            const url = new URL(tab.url);
            if (excludedDomains.includes(url.hostname)) {
                console.log(`Tab ${tab.id} with domain ${url.hostname} is excluded from moving.`);
                return;
            }
            move(activeInfo)
        });
    });

});


// 监听标签页关闭事件
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    console.log('onRemoved')
    if (rightList.includes(tabId)) {
        chrome.tabs.query({}, (tabs) => {
            chrome.storage.sync.get(['fixedTabs'], (data) => {
                const fixedTabs = data.fixedTabs || 3;
                updateRightList(tabs.filter((tab) => tab.windowId === removeInfo.windowId), fixedTabs);
            });
        });
    }
    console.log(`Tab ${tabId} removed. Updated rightList if necessary.`);
    if (moveTimeouts[tabId]) {
        clearTimeout(moveTimeouts[tabId]);
        delete moveTimeouts[tabId];
        console.log(`Cleared timeout for removed tab: ${tabId}`);
    }
});

// 监听标签页点击事件，标记为用户主动点击
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log('onUpdated')
    if (changeInfo.status === "complete") {
        console.log('changeInfo', changeInfo)
        // chrome.scripting.executeScript({
        //     target: { tabId: tabId },
        //     files: ["content.js"],
        // });
    }
});
