const openButton = document.querySelectorAll<HTMLButtonElement>('.open-modal');
const modalContent = document.querySelector<HTMLDivElement>('.modal-content');

openButton.forEach((btn) => {
    btn?.addEventListener('click', () => {
        const image = btn.querySelector('img')?.getAttribute('src');
        if (modalContent !== null) {
            modalContent.innerHTML = `<img src="${image}"/>`;
        }
    })
})