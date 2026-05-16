<%@ taglib prefix="jcr" uri="http://www.jahia.org/tags/jcr" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="template" uri="http://www.jahia.org/tags/templateLib" %>

<c:set var="pageId" value="${currentNode.properties['pageId'].string}"/>
<%-- Only render when pageId is a safe DNS subdomain label (a-z, 0-9, hyphen, 1-63 chars).
     Validate character by character to avoid injecting attacker-controlled content into JS. --%>
<c:set var="pageIdSafe" value="${fn:length(pageId) > 0 && fn:length(pageId) <= 63}"/>
<c:if test="${pageIdSafe}">
    <c:forEach var="i" begin="0" end="${fn:length(pageId) - 1}">
        <c:set var="c" value="${fn:substring(pageId, i, i + 1)}"/>
        <c:if test="${!fn:contains('abcdefghijklmnopqrstuvwxyz0123456789-', c)}">
            <c:set var="pageIdSafe" value="${false}"/>
        </c:if>
    </c:forEach>
</c:if>
<c:if test="${pageIdSafe}">
<script>(function(){
    var pageId = '${pageId}';
    var origin = 'https://' + pageId + '.statuspage.io';
    var frame = document.createElement('iframe');
    frame.src = origin + '/embed/frame';
    frame.style.position = 'fixed';
    frame.style.border = 'none';
    frame.style.boxShadow = '0 20px 32px -8px rgba(9,20,66,0.25)';
    frame.style.zIndex = '9999';
    frame.style.transition = 'left 1s ease, bottom 1s ease, right 1s ease';

    frame.title = 'Jahia Status';
    frame.setAttribute('aria-hidden', 'true');

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
        showFrame: function() {
            frame.tabIndex = '0';
            if (mobile) {
                frame.style.left = '0';
                frame.style.bottom = '0';
            } else {
                frame.style.left = 'auto';
                frame.style.right = '60px';
            }
        },
        dismissFrame: function(){
            frame.style.left = '-9999px';
            frame.tabIndex = '-1';
        }
    };

    window.addEventListener('message', function(event){
        if (event.origin !== origin) {
            return;
        }
        if (event.data && event.data.action && Object.prototype.hasOwnProperty.call(actions, event.data.action)) {
            actions[event.data.action](event.data);
        }
    }, false);

    window.statusEmbedTest = actions.showFrame;
})();
</script>
</c:if>
