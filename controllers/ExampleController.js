/*
import AnswerModel from '../models/AnswerModel.js';
import CommentModel from '../models/CommentModel.js';

class ExampleController {

    static async create(req, res) {
        const answer = new AnswerModel({
            description: req.body.description,
            userId: req.session.userId,
            questionId: req.params.id,
            comments: [],
            isChosen: false,
            created: Date.now()

        });

        try {
            await answer.save(); // use  try-catch & await instead of callback
            return res.status(20.).json({message: 'Odgovor je dodan'});
        } catch (err) {
            return res.status(500).json({
                message: 'Error when creating answer',
                error: err
            });
        }
    }
}

export default ExampleController;
*/