// util/http.js
import axios from "axios";

const BACKEND_URL = 
  'https://mobiledev-9f2ab-default-rtdb.firebaseio.com';

export async function storeExpense(expenseData) {
  const response = await axios.post(
    BACKEND_URL + '/expenses.json',
    expenseData
  );
  return response.data.name; // Firebase key
}

export async function fetchExpenses() {
  const response = await axios.get(
    BACKEND_URL + '/expenses.json'
  );

  const expenses = [];
  for (const key in response.data) {
    expenses.push({
      id:          key,
      amount:      response.data[key].amount,
      date:        new Date(response.data[key].date),
      description: response.data[key].description
    });
  }
  return expenses;
}

export function updateExpense(id, expenseData) {
  return axios.put(
    BACKEND_URL + `/expenses/${id}.json`,
    expenseData
  );
}

export function deleteExpense(id) {
  return axios.delete(
    BACKEND_URL + `/expenses/${id}.json`
  );
}
