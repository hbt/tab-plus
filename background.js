// Do not forget to include mapping actions files

// internal copy of the tabs. DO NOT use this unless the API prevents you from doing a specific action
// for example, there is no way to retrieve a removed tabs from the API, so, we use this instead
// tabIds: {windowId, id, index, url}
var internalTabs = [];

// a list of functions used to manipulate the internal tabs with ease.
var tabsManager =
{
    // pushes or updates internal tab using chrome tab
    createFromTab: function(tab)
    {

        if (this.tabExists(tab.id))
        {
            return this.updateFromTab(tab);
        } else
        {
            return this.pushTab(
                {
                    'id': tab.id,
                    'windowId': tab.windowId,
                    'url': tab.url,
                    'index': tab.index
                }
            );
        }
    },

    // checks if chrome tab already exists internally
    tabExists: function(tabId)
    {
        if (internalTabs[tabId]) return true;
        else return false;
    },

    // update internal tab using chrome tab
    updateFromTab: function(tab)
    {
        if (this.tabExists(tab.id))
        {
            // only update specific fields
            internalTabs[tab.id].windowId = tab.windowId;
            internalTabs[tab.id].url = tab.url;
            internalTabs[tab.id].index = tab.index;
            return this.get(tab.id);
        } else
        {
            return this.pushTab(tab);
        }

    },

    // retrieve internal using chrome tab id
    get: function(tabId)
    {
        if (this.tabExists(tabId)) return internalTabs[tabId];
        else return null;
    },

    // push internal tab using chrome tab data
    pushTab: function(tab)
    {
        if (this.tabExists(tab.id)) return this.updateFromTab(tab);

        // do not forget to add fields to updateFromTab if needed
        internalTabs[tab.id] =
        {
            'id': tab.id,
            'windowId': tab.windowId,
            'url': tab.url,
            'index': tab.index
        }

        return this.get(tab.id);
    },

    // HACK: the code to handle children is a hack until google-chrome decides to deliver a way for us to retrieve children
    // create parent/child relation between tabs
    pushChild: function(parentTabId, childTabId)
    {
        // check if parent and child exist
        if (this.tabExists(parentTabId) && this.tabExists(childTabId))
        {
            // create if children array
            if (internalTabs[parentTabId].children == undefined) internalTabs[parentTabId].children = new Array();

            internalTabs[parentTabId].children.push(childTabId);
        }
    },

    // check if parent has children
    hasChildren: function(parentTabId)
    {
        return internalTabs[parentTabId].children != undefined && internalTabs[parentTabId].children.length > 0 ? true : false;
    },

    // retrieve children tab ids
    getChildren: function(parentTabId)
    {
        if (this.hasChildren(parentTabId)) return internalTabs[parentTabId].children;

        return null;
    },

    // how many children?
    getChildrenCount: function(parentTabId)
    {
        if (this.getChildren(parentTabId) != null) return this.getChildren(parentTabId).length;

        return 0;
    },

    // retrieve children as internal tabs
    getChildrenTabs: function(parentTabId)
    {
        var children = this.getChildren(parentTabId);
        var childrenTabs = [];
        if (children != null)
        {
            for (var i in children)
            {
                var childTab = this.get(children[i]);
                if (childTab != null)
                {
                    childrenTabs[childTab.id] = childTab;
                }
            }
        }

        return childrenTabs;
    },

    // is this relationship valid?
    isParentChildOf: function(parentTabId, childTabId)
    {
        var itab = internalTabs[parentTabId];
        if (itab && this.hasChildren(itab.id))
        {
            for (var i in itab.children)
            {
                if (childTabId == itab.children[i]) return true;
            }
        }

        return false;
    },

    // returns tab parent id if there is one
    getParentId: function(childTabId)
    {
        for (var i in internalTabs)
        {
            var itab = internalTabs[i];
            if (tabsManager.hasChildren(itab.id) && tabsManager.isParentChildOf(itab.id, childTabId))
            {
                return itab.id;
            }
        }

        return null;
    },

    hasParent: function(childTabId)
    {
        return this.getParentId(childTabId) != null ? true : false;
    }
};

// end Tabs manager

// updates the browser actions icons, badge based on the status of currents tabs
// @param actionName in case we need to treat some actions differently
// Use this function to update the browser actions. It might be useful in the future if we have tons of actions and a lot of text to manage
// It should be done here instead of every action

function updateBrowserActionDetails(tabId, actionName, txt)
{
    if (internalTabs[tabId].text == undefined) internalTabs[tabId].text = new Array();

    // retrieve internal tab and update text as well.
    // Note: this is a hack until they add get functions to chrome.browserAction
    internalTabs[tabId].text[actionName] = txt;

    var allText = "";
    for (var i in internalTabs[tabId].text)
    {
        allText += internalTabs[tabId].text[i];
    }

    chrome.browserAction.setBadgeText(
        {
            "text": allText,
            "tabId": tabId
        }
    );
}





// CODE to handle key mapping and menu actions
// checks if we have an action for this keycode

function isMappingValid(keyCode)
{
    return mappingActions[keyCode] != undefined;
}

// calls the right function using the mapping

function callAction(keyCode)
{
    var actionName = mappingActions[keyCode];
    func = this[actionName];

    // call default entry point
    return func.execute();
}

function callMenuAction(actionName)
{
    if (this[actionName] != undefined) return this[actionName].execute();
}


// Listener for requests from content scripts
chrome.extension.onRequest.addListener(function(request, sender, response)
    {
        if (request.keyCode != undefined)
        {
            // build keycode
            var keyCode = '';
            if (request.shiftPressed) keyCode = 'SHIFT+' + String.fromCharCode(request.keyCode);
            else if (request.altPressed) keyCode = 'ALT+' + String.fromCharCode(request.keyCode);
            else keyCode = String.fromCharCode(request.keyCode);

            if (isMappingValid(keyCode))
            {
                callAction(keyCode);
            }
        } else if (request.menuAction != undefined)
        {
            callMenuAction(request.menuAction);

            // Note: figure out a way to hide the menu after selecting an item
            //          chrome.tabs.getSelected(null, function(tab)
            //                {
            //
            //                    chrome.pageAction.hide(tab.id);
            //
            //                }
            //            );
        }

    }
);

// END CODE to handle key mapping
// update internal structure
// Note: for some reason, it doesn't work when called from events. So, at the moment, please update manually using tabsManager.createFromTab
// until this is figured out

function updateInternalTabs()
{
    // retrieve all tabs from all windows and push them into the structure
    chrome.windows.getAll(
        {
            'populate': true
        },

        function(windows)
        {
            for (var i = 0; i < windows.length; i++)
            {
                var tabs = windows[i].tabs;
                for (j = 0; j < tabs.length; j++)
                {
                    //                console.log(tabs[j].id);
                    tabsManager.createFromTab(tabs[j]);
                }
            }
        }
    );
}

// initialize tabs internal structure

function initInternalTabs()
{
    updateInternalTabs();

    // add listener on created tabs to push them into the internal structure
    chrome.tabs.onCreated.addListener(function(tab)
        {
            // update the internal manager
            //            updateInternalTabs();
            tabsManager.createFromTab(tab);

            // update parent/children relationship
            chrome.tabs.getSelected(null, function(parentTab)
                {
                    if (parentTab.id != tab.id)
                    {
                        tabsManager.pushChild(parentTab.id, tab.id);
                    }
                }
            );
        }
    );

    // add listener when tabs are updated to update internal structure
    chrome.tabs.onUpdated.addListener(function(tabId, selectInfo, tab)
        {
            // update the internal manager
            //            updateInternalTabs();
            tabsManager.createFromTab(tab);
        }
    );

    // add listener update internal tabs when chrome tabs are moved around
    chrome.tabs.onMoved.addListener(function(tabId, moveInfo)
        {
            // update internal manager
            chrome.tabs.get(tabId, function(tab)
                {
                    tabsManager.createFromTab(tab);
                }
            );

        }
    );

    // register listeners to update internal tabs whenever something happens to a tab
    // add code here for detach, move etc.
    // maybe add code for time interval and call the update (Just in case)
}

initInternalTabs();


// testing here
//chrome.tabs.create({
//  'url': 'http://www.google.ca'
//});
//toggleProtectionAction.execute();
//chrome.tabs.getSelected(null, function(tab)
//  {
//    chrome.tabs.remove(tab.id, function() {});
//  }
//);
// code to reload extension automatically
/**

 function reloadme() { chrome.send('reload', ['ikdbemflgfoelmcoojpklnmjeajdabmp']); }
 window.setInterval('reloadme()', 5000);


 function reloadme() { chrome.send('reload', ['ikdbemflgfoelmcoojpklnmjeajdabmp']); }
 window.setInterval('reloadme()', 2000);

 */