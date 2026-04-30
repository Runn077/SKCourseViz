# SKCourseViz

SKCourseViz is an interactive course visualization tool for the University of Saskatchewan. It helps students explore, discover, and understand courses offered at USask through multiple views:

- **Graph** — An interactive force-directed graph showing all USask courses and their prerequisite relationships. Courses can be clustered by college, department, or subject, and individual courses can be searched and highlighted.
- **Heatmap** — A treemap visualization showing course quality ratings grouped by college and department, making it easy to spot highly rated or difficult programs at a glance.
- **List** — A sortable and filterable list of all USask courses ranked by quality, difficulty, or number of reviews.

Course rating data is sourced from Rate My Professors and aggregated to show average quality and difficulty scores per course.

**Live site:** [www.skcourseviz.ca](http://www.skcourseviz.ca)

---

## Tech Stack

**Frontend:**
- React + TypeScript
- Vite
- Sigma.js + Graphology (graph rendering)
- ForceAtlas2 (graph layout)
- D3.js (heatmap treemap)
- React Router

**Data:**
- Python + BeautifulSoup (USask course catalogue scraper)
- Playwright (Rate My Professors scraper)
- Data aggregation pipeline to join course and rating data

---

## Running Locally

**Prerequisites:**
- Node.js 18+
- npm

**Steps:**

1. Clone the repository:
```bash
git clone https://github.com/runn077/SKCourseViz.git
cd Usask-Course-Graph/course-graph
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open `http://localhost:5173` in your browser.