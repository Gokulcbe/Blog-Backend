import express from "express";
import { db, connectToDb} from './db.js';
import fs from 'fs';
import admin from 'firebase-admin';



const credentials = JSON.parse(
    fs.readFileSync('./credentials.json')
);

admin.initializeApp({
    credential: admin.credential.cert(credentials),
});

const app = express();

app.use(express.json()); //middleware for json post


app.use( async(req, res, next) => {
    const { authtoken } = req.headers;

    if(authtoken){
        try{
            const user = await admin.auth().verifyIdToken(authtoken);
            req.user = user;
        }
        catch(e){
            return res.sendStatus(400);
        }
    }
    req.user = req.user || {};
    next();
});


// app.get('/hello', (req, res) => {
//     res.send('Hello!');
// })

// app.get('/hello/:name', (req, res) => {
//     const name = req.params.name;
//     // const { name } = req.params;
//     res.send(`Hello ${name}!!!`);
// })

// multiple url get:
// app.get('/hello/:name/goodbye/:othername', (req, res) => {
//     console.log(req.params);
//     const name = req.params.name;
//     // const { name } = req.params;
//     res.send(`Hello ${name}!!!`);
// })

// app.post('/hello', (req, res) => {
//     console.log(req.body);
//     res.send(`Hello ${req.body.name}!`);
// })

// let articleInfo = [{
//     name: 'learn-react',
//     upvotes: 0,
//     comments: [],
// }
// ,{
//     name: 'learn-node',
//     upvotes: 0,
//     comments: [],
// }
// ,{
//     name: 'my-thoughts-on-resumes',
//     upvotes: 0,
//     comments: [],
// }]

app.get('/api/articles/:name', async (req, res) =>{
    const{ name } = req.params;
    const { uid } = req.user;

    const article = await db.collection('articles').findOne({ name });
    if(article){
        const upvoteIds = article.upvoteIds || [];
        article.canUpvote = uid && !upvoteIds.includes(uid);
        res.json(article);
        console.log(article);
    }
    else{
        res.sendStatus(404).send('The article not found');
    }
    // res.json(article); for json
})

app.use((req,res,next) => {
    if(req.user){
        next();
    }
    else{
        res.sendStatus(401);
    }
});

app.put('/api/articles/:name/upvote', async (req, res) => {
    const { name }= req.params;
    const { uid } = req.user;

    const article = await db.collection('articles').findOne({ name });
    if(article){
        const upvoteIds = article.upvoteIds || [];
        const canUpvote = uid && !upvoteIds.includes(uid);
        
        if(canUpvote){
            await db.collection('articles').updateOne({ name } , {
                $inc: { upvotes: 1},
                $push: { upvoteIds: uid }
            });
        }

    const updatedArticle = await db.collection('articles').findOne({ name });

        res.json(updatedArticle);
        // res.send(`The ${name} article now has ${article.upvotes} upvotes!!!`);
        console.log(article);
    }
    else{
        res.send('The article doesn\'t exist');
    }
})

app.post('/api/articles/:name/comments', async (req, res) => {
    const { name } = req.params;
    const { text } = req.body;
    const { email } = req.user;


    await db.collection('articles').updateOne( {name} , {
        $push: { comments: {postedby: email, text} },
    });

    const article = await db.collection('articles').findOne( {name} );

    if(article){

        // res.send(`The ${postedby} has commented on the article: ${text}!!!`);
        // res.send(article.comments);
        res.json(article);
        console.log(article);
    }
    else{
        res.send('The article doesn\'t exist');
    }
})


connectToDb(() =>{
    console.log('Succesfully connected to database');
    app.listen(8000, () => {
        console.log('Server is Listening on port 8000');
    })
})






//for temp db:
// app.put('/api/articles/:name/upvote', (req, res) => {
//     const { name }= req.params;
//     const article = articleInfo.find(a => a.name === name);
//     if(article){
//         article.upvotes += 1;
//         res.send(`The ${name} article now has ${article.upvotes} upvotes!!!`);
//         console.log(article);
//     }
//     else{
//         res.send('The article doesn\'t exist');
//     }
// })

// app.post('/api/articles/:name/comments', (req, res) => {
//     const { name } = req.params;
//     const { postedby, text } = req.body;
//     const article = articleInfo.find(a => a.name === name);
//     if(article){
//         article.comments.push({postedby, text});
//         res.send(`The ${postedby} has commented on the article: ${text}!!!`);
//         console.log(article);
//     }
//     else{
//         res.send('The article doesn\'t exist');
//     }
// })


// app.listen(8000, () => {
//     console.log('Server is Listening on port 8000');
// })