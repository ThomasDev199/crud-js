document.getElementById('modalStatus').dataset.state = d.status;

const learned = document.getElementById('modalLearned');
if (d.learned) learned.textContent = d.learned;