const axios = require('axios');
const express = require('express');
const { v4: uuidv4 } = require('uuid'); //uuidv4();
const app = express();
const port = process.env.PORT || 3000;

// ___________________________________________________________________________________________________________________________

app.set('views', 'views');
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

// ___________________________________________________________________________________________________________________________

const firebase = require('firebase');

const firebaseConfig = {
	apiKey: 'AIzaSyAq5XVdsp7qQZpAAoiL0UbJYZZOue_FvPI',
	authDomain: 'quizmania-cad35.firebaseapp.com',
	projectId: 'quizmania-cad35',
	storageBucket: 'quizmania-cad35.appspot.com',
	messagingSenderId: '522669806587',
	appId: '1:522669806587:web:5034fc09961d4d09ecf15e',
	measurementId: 'G-EQXW353XVV'
};

const firebaseApp = firebase.initializeApp(firebaseConfig);
const db = firebaseApp.firestore();

// ___________________________________________________________________________________________________________________________

app.get('/', (req, res) => {
	res.redirect('/home');
});

app.get('/home', (req, res) => {
	const images = {
		'General Knowledge': 'images/gk.png',
		'Entertainment: Books': 'images/books.jpg',
		'Entertainment: Film': 'images/movies.jpg',
		'Entertainment: Music': 'images/music.jpg',
		'Entertainment: Musicals & Theatres': 'images/theatres.jpg',
		'Entertainment: Television': 'images/television.jpg',
		'Entertainment: Video Games': 'images/videogames.jpg',
		'Entertainment: Board Games': 'images/boardgames.jpg',
		'Science & Nature': 'images/science.jpg',
		'Science: Computers': 'images/computers.jpg',
		'Science: Mathematics': 'images/maths.jpg',
		Mythology: 'images/mythology.jpg',
		Art: 'images/art.jpg',
		Celebrities: 'images/celebrities.jpg',
		Animals: 'images/animals.jpg',
		Vehicles: 'images/vehicles.jpg',
		'Entertainment: Comics': 'images/comics.jpg',
		'Science: Gadgets': 'images/gadgets.jpg',
		'Entertainment: Japanese Anime & Manga': 'images/anime.jpeg',
		'Entertainment: Cartoon & Animations': 'images/cartoon.png',
		Sports: 'images/sports.jpeg',
		Geography: 'images/geography.jpg',
		History: 'images/history.jpeg',
		Politics: 'images/politics.jpeg'
	};

	axios
		.get('https://opentdb.com/api_category.php')
		.then((data) => {
			res.render('home', { data: data.data, images: images });
		})
		.catch((error) => {
			console.log(error);
		});
});

app.get('/singleplayer/:id', (req, res) => {
	const { id } = req.params;

	axios
		.get(`https://opentdb.com/api_count.php?category=${id}`)
		.then((data) => {
			let categoryData = data.data;

			axios
				.get('https://opentdb.com/api_category.php')
				.then((response) => {
					let categories = response.data.trivia_categories;

					categories.map((category) => {
						if (category.id === parseInt(id)) {
							res.render('singlePlayer', { quizInfo: categoryData, quizName: category.name });
						}
					});
				})
				.catch((error) => {
					console.log(error);
				});
		})
		.catch((error) => {
			console.log(error);
		});
});

app.get('/singleplayer/:id/quiz', (req, res) => {
	const { id } = req.params;
	const { difficulty, amount } = req.query;
	let url = `https://opentdb.com/api.php?amount=${amount}&category=${id}&difficulty=${difficulty}&type=multiple`;

	axios
		.get(url)
		.then(async (data) => {
			function shuffle(array) {
				let currentIndex = array.length,
					randomIndex;

				// While there remain elements to shuffle...
				while (currentIndex != 0) {
					// Pick a remaining element...
					randomIndex = Math.floor(Math.random() * currentIndex);
					currentIndex--;

					// And swap it with the current element.
					[ array[currentIndex], array[randomIndex] ] = [ array[randomIndex], array[currentIndex] ];
				}

				return array;
			}

			let optionsFunc = (a) => {
				let r = [];
				a.map((question) => {
					let ans = question.correct_answer;
					r.push(shuffle([ ...question.incorrect_answers, ans ]));
				});
				return r;
			};
			let options = optionsFunc(data.data.results);
			let gameId = uuidv4();

			await db.collection('singlePlayerGames').doc(gameId).set({ questions: data.data.results }).then((data) => {
				console.log('Game Started');
			});

			res.render('singlePlayerQuiz', { questions: data.data.results, options: options, gameCode: gameId });
		})
		.catch((error) => {
			console.log(error);
		});
});

app.get('/singleplayer/:id/results/:gameCode', (req, res) => {
	let { gameCode } = req.params;
	let answers = req.query;

	db.collection('singlePlayerGames').doc(gameCode).get().then((snapshot) => {
		let result = 0;
		snapshot.data().questions.map((question, idx) => {
			if (question.correct_answer === answers[`${idx}flexRadioDefault`].slice(0, -1)) {
				result++;
			}
		});
		res.render('resutlsPage', { questions: snapshot.data().questions, answers: answers, result: result });
	});
});

app.get('/multiplayer', (req, res) => {
	res.render('multiPlayer');
});

app.get('/about', (req, res) => {
	res.render('about');
});

// ___________________________________________________________________________________________________________________________

app.listen(port, () => {
	console.log(`Example app listening at ${port}`);
});
