let db;
// Establish a connection to IndexedDB database called 'budget_tracker' and set it to version 1
const request = indexedDB.open("budget_tracker", 1);
// Create an object store (table) called `budget_tracker`, set it to have an auto incrementing primary key of sorts
request.onupgradeneeded = function (event) {
  //Save a reference to the database
  const db = event.target.result;
  db.createObjectStore("new_budget", { autoIncrement: true });
};

//Upon a successfull, run this function
request.onsuccess = function (event) {
  // When db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
  db = event.target.result;

  //check if online
  if (navigator.onLine) {
    uploadBudgets();
  }
};

request.onerror = function (event) {
  //console.logged error
  console.log(event.target.errorCode);
};

//Function to save a new budget even if there's no internet.
function saveRecord(record) {
  const transaction = db.transaction(["new_budget"], "readwrite");

  const budgetObjectStore = transaction.objectStore("new_budget");

  budgetObjectStore.add(record);
}

function uploadBudgets() {
  //Open the transaction on your db
  const transaction = db.transaction(["new_budget"], "readwrite");

  //Access the object store
  const budgetObjectStore = transaction.objectStore("new_budget");

  //Get all records from the store and set to a variable
  const getAll = budgetObjectStore.getAll();

  //Upon successful .getAll() execution, run this function
  getAll.onsuccess = function () {
    //If there was data in indexedDB's store, let's send it to the api server
    if (getAll.result.length > 0) {
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          //Open one more transaction
          const transaction = db.transaction(["new_budget"], "readwrite");
          //Access the new_budget object store
          const budgetObjectStore = transaction.objectStore("new_budget");
          //Clear all items in your store
          budgetObjectStore.clear();

          alert("All saved offline transactions have been submitted!");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

//Listen for app to come back online
window.addEventListener("online", uploadBudgets);
