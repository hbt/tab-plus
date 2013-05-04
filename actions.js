// holds data by actions names
var data = [];

// Actions here
// close other windows action
var closeOtherWindowsAction =
{
    execute: function()
    {
// get the current window
        chrome.windows.getCurrent(function(currentWindow)
            {
// get all windows
                chrome.windows.getAll(null, function(windows)
                    {
// remove and keep the current one
                        for (var i in windows)
                        {
                            var window = windows[i];
                            if (window.id != currentWindow.id)
                            {
                                chrome.windows.remove(window.id);
                            }
                        }
                    }
                );


            }
        );


    }
};


// toggles between the current tab and the last selected tab
var toggleLastSelectedTabAction =
{
    execute: function()
    {
        chrome.tabs.update(data["toggleOpeningTabRightAction"][0],
            {
                'selected': true
            }
        );

    },

    init: function()
    {
// save current tab
        chrome.tabs.getSelected(null, function(tab)
            {
                if (!data["toggleOpeningTabRightAction"])
                {
                    data["toggleOpeningTabRightAction"] = new Array();
                    data["toggleOpeningTabRightAction"][0] = tab.id;
                    data["toggleOpeningTabRightAction"][1] = tab.id;
                }
            }
        );

// when we change tabs, let's update the variable
        chrome.tabs.onSelectionChanged.addListener(function(tabId, selectInfo)
            {
                data["toggleOpeningTabRightAction"][0] = data["toggleOpeningTabRightAction"][1];
                data["toggleOpeningTabRightAction"][1] = tabId;

            }
        );
    }
}

toggleLastSelectedTabAction.init();

// activate tab on the right
var toggleOpeningTabRightAction =
{
    execute: function()
    {
        this.toggle();
    },

    init: function()
    {
        if (data["toggleOpeningTabRightAction"] == undefined) data["toggleOpeningTabRightAction"] = 0;

        chrome.tabs.onSelectionChanged.addListener(function(tabId, selectInfo)
            {
// when we move to a new tab, we have to update the browser_action
                if (data["toggleOpeningTabRightAction"] == 1)
                {
                    updateBrowserActionDetails(tabId, 'toggleOpeningTabRightAction', 'T');
                    chrome.tabs.getSelected(null, function(parentTab)
                        {
                            chrome.tabs.onCreated.addListener(function(tab)
                                {
                                    if (data["toggleOpeningTabRightAction"] == 1)
                                    {
// move tab right to the selected one
                                        chrome.tabs.move(tab.id,
                                            {
                                                index: parentTab.index + 1
                                            }
                                        );
                                    }
                                }
                            );
                        }
                    );

                }

                else
                {
                    updateBrowserActionDetails(tabId, 'toggleOpeningTabRightAction', '');
                }
            }
        );
    },

    toggle: function()
    {
        if (data["toggleOpeningTabRightAction"] == 1)
        {
            data["toggleOpeningTabRightAction"] = 0;
            chrome.tabs.getSelected(null, function(tab)
                {
                    updateBrowserActionDetails(tab.id, 'toggleOpeningTabRightAction', '');
                }
            );

        } else
        {

            data["toggleOpeningTabRightAction"] = 1;
            chrome.tabs.getSelected(null, function(tab)
                {
                    updateBrowserActionDetails(tab.id, 'toggleOpeningTabRightAction', 'T');
                }
            );
        }
    }
}

toggleOpeningTabRightAction.init();

// reverse tabs and stops at the selected tab
var reverseTabsAction =
{
    execute: function()
    {
        chrome.tabs.getSelected(null, function(tab)
            {
// retrieve all tabs in current window
// reverse tabs and stop at selected tab
                lastIndex = tab.index + 1;

                chrome.tabs.getAllInWindow(null, function(tabs)
                    {
                        for (var i = tabs.length - 1; i > 0; i--)
                        {
                            chrome.tabs.move(tabs[i].id,
                                {
                                    index: lastIndex
                                }
                            );

// break at the selected tab
                            if (tabs[i - 1] && tabs[i - 1].id == tab.id) break;
                            lastIndex = lastIndex + 1;
                        }
                    }
                );
            }
        );
    }
}

// reverse children tabs order
var reverseChildrenOrderAction =
{
    execute: function()
    {
// retrieve selected tab
        chrome.tabs.getSelected(null, function(tab)
            {
// is it a parent?
                if (tabsManager.hasChildren(tab.id))
                {
// get the children ids
                    var childrenIds = tabsManager.getChildren(tab.id);


// reverse the index position
                    childrenIds.reverse();
                    var lastIndex = tab.index + 1;
                    for (var i = childrenIds.length - 1; i > 0; i--)
                    {
// move the tabs around
                        chrome.tabs.get(childrenIds[i], function(childTab)
                            {
                                if (childTab)
                                {
                                    chrome.tabs.move(childTab.id,
                                        {
                                            index: lastIndex
                                        }
                                    );
                                }
                            }
                        );

                        lastIndex = lastIndex + 1;
                    }


                }
            }
        );
    }
};

// close tabs on the left
var closeTabsLeftAction =
{
    execute: function()
    {
// retrieve selected tab
        chrome.tabs.getSelected(null, function(tab)
            {
// retrieve the index and remove all tabs before that
                chrome.tabs.getAllInWindow(null, function(tabs)
                    {
                        for (var i in tabs)
                        {
                            if (tabs[i].index < tab.index)
                            {
                                chrome.tabs.remove(tabs[i].id);
                            }
                        }
                    }
                );
            }
        );
    }
};

// Detach tab with children
var detachWithChildrenAction =
{
    execute: function()
    {
        chrome.tabs.getSelected(null, function(tab)
            {
// is it a parent?
                if (tabsManager.hasChildren(tab.id))
                {
// retrieve children tabs
                    var childrenTabs = tabsManager.getChildrenTabs(tab.id);

// create new window
                    chrome.windows.create(
                        {
                            url: tab.url
                        },


                        function(window)
                        {
// move the parent and children to the new window
                            for (var i in childrenTabs)
                            {
                                var childTab = childrenTabs[i];
                                chrome.tabs.move(childTab.id,
                                    {
                                        windowId: window.id,
                                        index: childTab.index
                                    }
                                );
                            }

// remove parent from current window
                            chrome.tabs.remove(tab.id);

                        }
                    );
                }

            }
        );

    }
};


// opens tab right next to the selected one
var openTabRightAction =
{
    execute: function()
    {
        chrome.tabs.getSelected(null, function(tab)
            {
                chrome.tabs.create(
                    {},


                    function(createdTab)
                    {
                        chrome.tabs.move(createdTab.id,
                            {
                                index: tab.index + 1
                            }
                        );
                    }
                );
            }
        );
    }
};


// protects the children if the selected tab is a parent
// otherwise, protect brothers
var toggleProtectionChildrenAction =
{
    execute: function()
    {

// initialize toggleProtection
        toggleProtectionAction.init();

// get selected tab
        chrome.tabs.getSelected(null, function(tab)
            {
                var parentTab = null;
// is it a parent?
                if (tabsManager.getChildrenCount(tab.id) > 0)
                {
                    parentTab = tab;
                } else
                {
// is it a brother?
                    if (tabsManager.hasParent(tab.id))
                    {
// retrieve parent
                        parentTab = internalTabs[tabsManager.getParentId(tab.id)];
                    }
                }

// retrieve the children and toggle protection
                if (parentTab != null)
                {
                    var childrenTabs = tabsManager.getChildrenTabs(parentTab.id);

// loop and toggle
                    for (var i in childrenTabs)
                    {
                        toggleProtectionAction.toggleProtection(childrenTabs[i].windowId, childrenTabs[i].id);
                    }
                }
            }
        );
    }
};


var reloadChildrenAction =
{
    execute: function()
    {
        chrome.tabs.getSelected(null, function(tab)
            {


                var parentTab = null;
// is it a parent?
                if (tabsManager.getChildrenCount(tab.id) > 0)
                {
                    parentTab = tab;
                } else
                {
// is it a brother?
                    if (tabsManager.hasParent(tab.id))
                    {
// retrieve parent
                        parentTab = internalTabs[tabsManager.getParentId(tab.id)];
                    }
                }

// retrieve the children and toggle protection
                if (parentTab != null)
                {
                    var childTabs = tabsManager.getChildrenTabs(parentTab.id);

                    for (var i in childTabs)
                    {
                        chrome.tabs.update(childTabs[i].id,
                            {
                                'url': childTabs[i].url,
                                'selected': childTabs[i].selected
                            }
                        );
                    }
                }

            }
        );

    }
};

// reloads all tabs in current window
var reloadAllTabsAction =
{
    execute: function()
    {
// retrieve all tabs in current window
        chrome.windows.getCurrent(function(window)
            {
                chrome.tabs.getAllInWindow(window.id, function(tabs)
                    {

// loop and reload
                        for (var i in tabs)
                        {
                            chrome.tabs.update(tabs[i].id,
                                {
                                    'url': tabs[i].url,
                                    'selected': tabs[i].selected
                                }
                            );
                        }
                    }
                );
            }
        );

    }
};


// This action let's you mark a tab as protected. When closing other tabs, this tab is safe and it is reloaded.
// Ideally, the tab should not be reloaded, it should stay the way it is
// It updates the browser actions accordingly
var toggleProtectionAction =
{

// default entry point
    execute: function()
    {

        this.init();
// retrieve current tab
        chrome.windows.getCurrent(function(window)
            {
                chrome.tabs.getSelected(window.id, function(tab)
                    {
// toggle protection
                        toggleProtectionAction.toggleProtection(window.id, tab.id);
                    }
                );
            }
        );
    },

// initialize
    init: function()
    {

// store data by action key
        if (!data['toggleProtectionAction'])
        {
            data['toggleProtectionAction'] = [];
        }

// add listener to update the browser actions based on the status of the current tab (is it protected? etc.)
        chrome.tabs.onSelectionChanged.addListener(function(tabId, selectInfo)
            {
// when we move to a new tab, we have to update the browser_action
                toggleProtectionAction.isTabProtected(selectInfo['windowId'], tabId);
            }
        );

// add listener to update the browser action when the tab is reloaded or moving to a new page
        chrome.tabs.onUpdated.addListener(function(tabId, selectInfo, tab)
            {
                toggleProtectionAction.isTabProtected(tab.windowId, tab.id);
            }
        );

// add listener to recreate the protected tabs in all windows when a removal is detected
// HACK: at the moment, we have no other choice than reloading the tab
        chrome.tabs.onRemoved.addListener(function(tabId)
            {
                var internalTab = tabsManager.get(tabId);

                if (internalTab != null)
                {
// check if the window still exists and recreate only if it is the case
                    chrome.windows.get(internalTab.windowId, function(window)
                        {
                            if (window != null && toggleProtectionAction.isTabProtected(internalTab.windowId, internalTab.id))
                            {

                                toggleProtectionAction.unprotectTab(internalTab.windowId, internalTab.id);

// recreate tab
                                chrome.tabs.create(
                                    {
                                        'windowId': internalTab.windowId,
                                        'index': internalTab.index,
// TODO: add selected in internal structure
//                            'selected': internalTab.selected,
                                        'url': internalTab.url
                                    },


                                    function(tab)
                                    {
                                        chrome.tabs.update(tab.id,
                                            {
                                                'url': tab.url,
                                                'selected': tab.selected
                                            },

                                            function()
                                            {

                                                toggleProtectionAction.protectTab(tab.windowId, tab.id);
                                            }
                                        );
                                    }
                                );
                            }
                        }
                    );
                }
            }
        );

    },

// toggle protection
    toggleProtection: function(windowId, tabId)
    {
        if (this.isTabProtected(windowId, tabId))
        {
            this.unprotectTab(windowId, tabId);
        } else
        {
            this.protectTab(windowId, tabId);
        }
    },

// checks data if this tab is protected or not
// TODO: improve the representation by using tab ids only. I think the ids are not the same between windows, an extra level is not necessary
// Note: Confirm speculation first.
    isTabProtected: function(windowId, tabId)
    {
        if (data['toggleProtectionAction'] && data['toggleProtectionAction'].length > 0 && data['toggleProtectionAction'][windowId] && data['toggleProtectionAction'][windowId][tabId] == 1)
        {
            updateBrowserActionDetails(tabId, 'toggleProtectionAction', 'P');

            return true;
        }

        updateBrowserActionDetails(tabId, 'toggleProtectionAction', '');
        return false;
    },

    protectTab: function(windowId, tabId)
    {
        if (!data['toggleProtectionAction'][windowId]) data['toggleProtectionAction'][windowId] = [];
        data['toggleProtectionAction'][windowId][tabId] = 1;
        this.isTabProtected(windowId, tabId);
    },

    unprotectTab: function(windowId, tabId)
    {
        data['toggleProtectionAction'][windowId][tabId] = 0;
        this.isTabProtected(windowId, tabId);
    }
};