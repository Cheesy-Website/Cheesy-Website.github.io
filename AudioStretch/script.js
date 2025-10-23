const speeds = [1.5, 0.83, 0.56, 0.25];
const pitches = [-1, 1];

function changeSource(audio, button) {
    audio.pause();
    while (audio.firstChild) {
        audio.removeChild(audio.lastChild);
    }
    if (audio.hasAttribute('data-button')) {
        const previousButton = document.getElementById(audio.getAttribute('data-button'));
        previousButton.classList.remove('playing');
        audio.removeAttribute('data-button');
        if (button === previousButton)
            return false;
    }
    if (button) {
        button.classList.add('playing');
        const source = document.createElement('source');
        source.setAttribute('src', button.getAttribute('data-source') + ".aac");
        audio.pause();
        audio.currentTime = 0;
        audio.appendChild(source);
        audio.setAttribute('data-button', button.getAttribute('id'));
        audio.load();
        audio.play();
        audio.playbackRate = parseFloat(button.getAttribute('data-rate'));
        return true;
    }
}

function clickPlayButton(event) {
    const audio = document.getElementsByTagName('audio')[0];
    time = 0;
    if (event.shiftKey && audio.firstChild) {
        const seq1 = audio.getAttribute('data-button').split('-')[1];
        const seq2 = this.getAttribute('id').split('-')[1];
        const speed1 = parseFloat(audio.getAttribute('data-button').split('-')[3]);
        const speed2 = parseFloat(this.getAttribute('id').split('-')[3]);
        if (seq1 == seq2) {
            time = audio.currentTime;
            time *= speed1;
            time -= 1;
            time /= speed2;
            if (time < 0)
                time = 0;
        }
    }
    if (changeSource(audio, this)) {
        audio.currentTime = time;
        audio.play();
    }
    event.stopPropagation();
}

const audio = document.getElementsByTagName('audio')[0];
audio.addEventListener('ended', function () {
    const playing = document.getElementsByClassName('playing');
    if (playing.length) {
        const button = playing[0];
        button.classList.remove('playing');
    }
});

function switchPlayback(sequence) {
    let button;
    if (audio.firstChild && audio.hasAttribute('data-button')) {
        let parts = audio.getAttribute('data-button').split('-');
        parts[1] = sequence;
        button = document.getElementById(parts.join('-'));
    }
    if (changeSource(audio, button)) {
        audio.play();
    }
}

document.getElementById('listening-tables').getElementsByTagName('select')[0].onchange();
document.getElementById('snr-tables').getElementsByTagName('select')[0].onchange();
document.getElementById('noise').getElementsByTagName('select')[0].onchange();

document.getElementById('wraps').innerText = ''
