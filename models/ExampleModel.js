import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const ExampleSchema = new Schema({
	'text' : String,
    'userId': String
});

const Model = mongoose.model('Example', ExampleSchema);

export default Model;