// CA = Career Assessment helper object (shared across pages)
const CA = (function () {
  const DEFAULT_FILE = 'data/questions.json';
  // default recommendations mapping (by type)
  const RECOMMEND = {
    logic: [{title: 'Software Developer', reason: 'Strong logical and problem-solving skills.'},
            {title: 'Data Analyst', reason: 'Good at working with data and numbers.'}],
    creative: [{title: 'Graphic Designer', reason: 'Strong visual and creative skills.'},
               {title: 'Content Creator', reason: 'Good at creative expression and communication.'}],
    people: [{title: 'HR / Manager', reason: 'Enjoys teamwork and people tasks.'},
             {title: 'Teacher / Trainer', reason: 'Good at communication and mentoring.'}],
    hands: [{title: 'Engineer / Technician', reason: 'Likes hands-on work and practical tasks.'}]
  };

  async function fetchDefaultQuestions() {
    try {
      const res = await fetch(DEFAULT_FILE);
      if (!res.ok) throw new Error('Fetch failed');
      return await res.json();
    } catch (e) {
      // fallback small default
      return [
        {"question":"Do you enjoy solving logical problems?","options":["Yes","No"],"type":"logic"},
        {"question":"Do you like designing or creating visuals?","options":["Yes","No"],"type":"creative"},
        {"question":"Do you enjoy working with data and numbers?","options":["Yes","No"],"type":"logic"},
        {"question":"Do you prefer teamwork and communication tasks?","options":["Yes","No"],"type":"people"},
        {"question":"Do you enjoy working with your hands or building things?","options":["Yes","No"],"type":"hands"}
      ];
    }
  }

  async function loadQuestions() {
    // priority: localStorage (admin saved) -> bundled data file
    const ls = localStorage.getItem('ca_questions');
    if (ls) {
      try { return JSON.parse(ls); } catch (e) { localStorage.removeItem('ca_questions'); }
    }
    return await fetchDefaultQuestions();
  }

  // Render paged quiz, simple next/prev
  function renderPagedQuiz(containerId, questions, opts={pageSize:4}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    const pageSize = opts.pageSize || 4;
    let page = 0;
    const totalPages = Math.ceil(questions.length / pageSize);

    function renderPage() {
      container.innerHTML = '';
      const start = page * pageSize;
      const slice = questions.slice(start, start + pageSize);
      slice.forEach((q, idx) => {
        const qidx = start + idx;
        const div = document.createElement('div');
        div.className = 'qblock';
        let html = `<p>${qidx + 1}. ${q.question}</p>`;
        html += q.options.map(opt => {
          const id = `q${qidx}_${opt}`;
          return `<label><input type="radio" name="q${qidx}" id="${id}" value="${opt}"> ${opt}</label>`;
        }).join(' ');
        div.innerHTML = html;
        container.appendChild(div);
      });

      // controls visibility
      document.getElementById('prevBtn').style.display = (page === 0) ? 'none' : 'inline-block';
      document.getElementById('nextBtn').style.display = (page === totalPages - 1) ? 'none' : 'inline-block';
      document.getElementById('submit-area').style.display = (page === totalPages - 1) ? 'block' : 'none';
    }

    document.getElementById('prevBtn').onclick = () => { if (page>0){page--; renderPage();} };
    document.getElementById('nextBtn').onclick = () => { if (page < totalPages -1){page++; renderPage();} };

    document.getElementById('submit-btn').onclick = () => {
      const score = {};
      let answered = 0;
      questions.forEach((q, i) => {
        const sel = document.querySelector(`input[name="q${i}"]:checked`);
        if (!score[q.type]) score[q.type] = 0;
        if (sel && sel.value.toLowerCase() === 'yes') {
          score[q.type] += 1;
          answered++;
        }
      });
      localStorage.setItem('ca_results', JSON.stringify(score));
      localStorage.setItem('ca_last_question_count', JSON.stringify(answered));
      // go to results
      window.location.href = 'results.html';
    };

    // initial render
    renderPage();
  }

  // Basic recommendation engine: pick top types and return mapped careers
  function getRecommendations(scoreObj) {
    const keys = Object.keys(scoreObj || {});
    if (keys.length === 0) return [{title:'No data', reason:'No answers recorded.'}];
    // sort types by score desc
    const sorted = keys.sort((a,b) => (scoreObj[b]||0) - (scoreObj[a]||0));
    const top = sorted.slice(0, 2);
    const out = [];
    top.forEach(t => {
      const items = RECOMMEND[t] || [{title: `General: ${t}`, reason: 'Based on your responses.'}];
      items.slice(0,2).forEach(it => out.push(it));
    });
    return out;
  }

  return {
    loadQuestions,
    fetchDefaultQuestions,
    renderPagedQuiz,
    getRecommendations
  };
})();
