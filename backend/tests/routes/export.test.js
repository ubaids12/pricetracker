import test from 'node:test';
import assert from 'node:assert/strict';
import { toCsv } from '../../src/services/csvExport.service.js';

test('csv export writes the assignment columns and values', () => {
	assert.equal(toCsv([{ price: 10 }]), 'store_product_id,product_name,selected_option,timestamp,price,stock,outcome\n"","","","",10,"",""');
});
