const socket = io();

const $messageForm = document.querySelector('#message-form')
const $input = document.querySelector('#text');
const $button = document.querySelector('#send')
const $location = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix:true })

const autoscroll = () => {
    const $newMessage = $messages.lastElementChild

    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    const visibleHeight = $messages.offsetHeight;

    const containerHeight = $messages.scrollHeight;
    
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop =$messages.scrollHeight
    }
    
}

socket.on('locationMessage', (url) => {
    console.log(url);
    const html = Mustache.render(locationMessageTemplate, {
        username: url.username,
        url: url.url,
        createdAt: moment(url.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
})

socket.on('message', (message) => {
    console.log(message);
    if(message.text === ""){
        return alert('Message required')
    }
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML=html
    
})


$button.addEventListener('click', (e) => {
    e.preventDefault();
    $button.setAttribute('disabled', 'disabled')
    
    socket.emit('sendMessage', $input.value, (error) => {
        $button.removeAttribute('disabled')
        $input.value = '';
        $input.focus()
        if(error){
            return console.log(error);
            
        }
        console.log('Message delivered!');
        
    });
    
})

$location.addEventListener('click', (e) => {
    e.preventDefault();
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser');
    }

    $location.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        $location.removeAttribute('disabled')
        socket.emit('sendLocation', {
            longitude : position.coords.longitude,
            latitude : position.coords.latitude
        }, () => {
            console.log('Location shared!');
            
        })
    })
})

socket.emit('join', {username,room}, (error) => {
    if(error) {
        alert(error);
        location.href = '/'
    }
})