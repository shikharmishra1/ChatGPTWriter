import { sendToContentScript } from '@plasmohq/messaging'
let toggle = false
chrome.action.onClicked.addListener(() => {
    toggle = !toggle
    if(toggle) {
    sendToContentScript({
        name: 'openContent',
        body:{
            message: 'openContent'
        }

    })
} else {
    sendToContentScript({
        name: 'closeContent',
        body:{
            message: 'closeContent'
        }

    })}
}
);
chrome.runtime.onMessage.addListener((m) => {
    if(m.name === 'closeContent') {
        toggle = false
        
    }
})