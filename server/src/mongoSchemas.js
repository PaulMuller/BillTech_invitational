const { Schema, Types, mongo } = require('mongoose')
require('dotenv').config({ path: 'src/.env' })

module.exports.usersSchema = new Schema({
	address: { type: String, required: true, unique: true, dropDups: true },
	first_sign_in_timestamp: Number,
	last_sign_in_timestamp: Number,
	is_owner: { type: Boolean, required: true, unique: true, default: false },
	referrer: { type: String, default: process.env.OWNER }
})

module.exports.swapSchema = new Schema({
	hash: { type: String, required: true, unique: true, dropDups: true },
	swapper: { type: String, required: true },
	block_number: { type: Number, required: true },
	method: { type: String, required: true },
	value: { type: Number, required: true },
	token_in: { type: String, required: true },
	token_out: { type: String, required: true },
	amount_in: { type: Types.Decimal128, required: true },
	amount_out: { type: Types.Decimal128, required: true },
})

module.exports.paymentsSchema = new Schema({
	timestamp: Number,
	receiver: String,
	token_amount: Number,
	token_address: String,
})

module.exports.debetPipeline = [
	{
		'$lookup': {
			'from': 'swaps',
			'localField': 'address',
			'foreignField': 'swapper',
			'pipeline': [
				{
					'$group': {
						'_id': '$token_out',
						'ref_counted': {
							'$sum': {'$divide': ['$amount_out', 20]}	
						}
					}
				}
			],
			'as': 'ref_royalty'
		},
		'$project': {
			'address': '$address',
			'referrer': '$referrer',
			'ref_royalty': '$ref_royalty'
		}
	}
]



