export function statuspageIoBanner(pageId) {
    var frame = document.createElement('iframe');
    var origin = 'https://' + pageId + '.statuspage.io';
    frame.src = origin + '/embed/frame';
    frame.style.position = 'fixed';
    frame.style.border = 'none';
    frame.style.boxShadow = '0 20px 32px -8px rgba(9,20,66,0.25)';
    frame.style.zIndex = '9999';
    frame.style.transition = 'left 1s ease, bottom 1s ease, right 1s ease';

    frame.title = 'Jahia Status';
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;

    var mobile;
    if (mobile = screen.width < 450) {
        frame.src += '?mobile=true';
        frame.style.height = '20vh';
        frame.style.width = '100vw';
        frame.style.left = '-9999px';
        frame.style.bottom = '-9999px';
        frame.style.transition = 'bottom 1s ease';
    } else {
        frame.style.height = '115px';
        frame.style.width = '320px';
        frame.style.left = 'auto';
        frame.style.right = '-9999px';
        frame.style.bottom = '60px';
    }

    document.body.appendChild(frame);

    var actions = {
        showFrame: function () {
            frame.style.display = 'block';
            frame.removeAttribute('aria-hidden');
            frame.tabIndex = 0;
            if (mobile) {
                frame.style.left = '0';
                frame.style.bottom = '0';
            } else {
                frame.style.left = 'auto';
                frame.style.right = '60px';
            }
        },
        dismissFrame: function () {
            // Move focus before hiding to prevent focus loss
            if (document.activeElement === frame || frame.contains(document.activeElement)) {
                document.body.focus();
            }
            if (mobile) {
                frame.style.left = '-9999px';
            } else {
                frame.style.right = '-9999px';
            }
            frame.setAttribute('aria-hidden', 'true');
            frame.tabIndex = -1;
            // Fully remove from accessibility tree after transition completes
            setTimeout(function () {
                frame.style.display = 'none';
            }, 1000);
        }
    };

    window.addEventListener('message', function (event) {
        // Validate origin before processing postMessage
        if (event.origin !== origin) {
            return;
        }
        if (event.data.action && actions.hasOwnProperty(event.data.action)) {
            actions[event.data.action](event.data);
        }
    }, false);
}
