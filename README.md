# StreamFinder 


StreamFinder is a web app that helps you find out where a movie or show is streaming right now. It also tracks your watchlist and recommends which subscription(s) to keep, based on maximum coverage of the titles you actually want to watch.

This project was built as a hands-on way to learn **FastAPI**, backend/frontend integration, and Git/GitHub workflows from scratch, with real functionality behind it.

---

## Features

- **Search**: find which streaming platforms currently host a given movie
- **Watchlist** *(planned)*: save movies you want to watch
- **Subscription recommender** *(planned)*: suggests the smallest combination of subscriptions that covers your watchlist, using a greedy set cover algorithm

---

## Tech Stack

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) —> Python web framework
- [uv](https://docs.astral.sh/uv/) —> Python package/project manager
- CORS middleware for frontend-backend communication

**Frontend**
- HTML5 / CSS3
- Vanilla JavaScript (`fetch` API)

---

## Project Structure

## Project Structure

```
streamfinder/
├── backend/
│   ├── main.py           # FastAPI app entry point and routes
│   └── ...
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── Logo.png
├── .gitignore
└── README.md
```

## Running Locally

### Backend

\```bash
cd backend
uv run fastapi dev
\```

The API will be available at `http://127.0.0.1:8000`.

### Frontend

Open `frontend/index.html` using a live server (e.g. VS Code's Live Server extension), typically available at `http://127.0.0.1:5500`.

> Make sure the backend's CORS settings allow requests from your frontend's origin.

---

## Roadmap

- [x] Basic FastAPI setup with search endpoint
- [x] Frontend connected to backend via `fetch`
- [ ] Integrate real streaming availability data
- [ ] Watchlist creation and persistence
- [ ] Subscription recommendation engine (greedy set cover)
- [ ] Ratings display

---

## Author

Made by [eftrotto](https://github.com/eftrotto) and [gvfirmeza](https://github.com/gvfirmeza) a project born out of curiosity for FastAPI, movies, and a good algorithmic challenge.