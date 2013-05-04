var menu = document.getElementById('menu');

for (var actionName in menuActions)
{
    // create li element
    var li = document.createElement('li');
    li.id = actionName;
    li.innerText = menuActions[actionName];

    // loop and check if this action has a hotkey
    for (var hotkey in mappingActions)
    {
      if (mappingActions[hotkey] == actionName)
      {
        li.innerHTML += ' -- CTRL+  ' + hotkey;
        break;
      }
    }

    li.addEventListener("click", function(event)
        {
            var target = event.target;
            chrome.extension.sendRequest(
                {
                    menuAction: target.id
                }
            );
        },
        false);

    menu.appendChild(li);
}