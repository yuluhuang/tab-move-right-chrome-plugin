// popup.js
angular.module('app', [])
    .controller('OptionsController', function ($scope) {
        // 默认的设置
        $scope.title = 'Tab移到设置'
        $scope.showTip = false
        $scope.settings = {
            open: false,
            interval: 1,
            afterMove: true, // 将上一个tab移到最右边
            delay: 0.1, // 默认延迟时间
            fixedTabs: 3 // 默认右侧固定标签数量
        };

        // 保存设置到 chrome.storage
        $scope.saveSettings = function () {
            // 保存设置到 Chrome Storage
            chrome.storage.sync.set($scope.settings, function () {
                console.log($scope.settings)
                $scope.showTip = true
                $scope.$apply();//需要手动刷新
                setTimeout(() => {
                    $scope.showTip = false
                    $scope.$apply();//需要手动刷新
                }, 2000)
            });
        };

        // 从 chrome.storage 加载设置
        $scope.loadSettings = function () {
            // 从 Chrome Storage 同步加载设置
            chrome.storage.sync.get(['delay', 'fixedTabs', 'afterMove', 'open', 'interval'], (data) => {
                console.log(data)
                $scope.settings.delay = data.delay || 0.1;
                $scope.settings.fixedTabs = data.fixedTabs === 0 ? 0 : (data.fixedTabs || 3);
                $scope.settings.afterMove = data.afterMove;
                $scope.settings.interval = data.interval === 0 ? 0 : (data.interval || 1);
                $scope.settings.open = data.open;
                $scope.$apply();//需要手动刷新
            });
        };

        // 初始化时加载设置
        $scope.loadSettings();
    });
