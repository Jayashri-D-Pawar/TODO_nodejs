// AJAX -> fires HTTP request in background-> XMLHTTP-Request
// server request paralley
// fetch()-> to fetch data from browser

const submit_btn = document.getElementById("submit_btn");
const new_task = document.getElementById("new_task");
const priority = document.getElementById("priority");
const tasks = document.querySelector(".tasks")

submit_btn.addEventListener("click", function(){

    const todoText = new_task.value;
    const prio = priority.value;
    const todoimg = document.querySelector("input[name='todoimg']").files[0];   //1m

    if(!todoText || !prio){
        alert("please enter task or priority first!!********");
        return;
    }
   
    const todo = new FormData();
    todo.append("todoText", todoText);
    todo.append("prio", prio);
    todo.append("todoimg", todoimg);

    fetch("/todo", {
      method: "POST",
      body: todo,
    })
      .then(function (response) {
        if (response.ok) {
          return response.json();
        } else {
          alert("Something went wrong");
        }
      })
      .then(function (todos) {
          showTodoInUI(todos);
      })
      .catch(function (error) {
        console.log(error.message);
      });
   
    document.getElementById("new_task").value = "";
    document.getElementById("todoimgid").value = '';
});
function showTodoInUI(todo){
    let div = document.createElement('div');
    
    const todoTextNode = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.done === "done"; 
   
    
    const button = document.createElement("button");
    const todoPriority = document.createElement("label");
    todoTextNode.innerText = todo.todoText;
    todoPriority.innerText = todo.prio;
   
    button.textContent = "Cancle";
  
    handleDeleteClick(todo, div, button);
    handleCheckboxChange(todo, todoTextNode, todoPriority, checkbox);

    todoPriority.classList.add('priority-btn');
    div.classList.add('task-item');

    const todoimg = document.createElement("img");    //1m
    todoimg.src = todo.todoimg;
    todoimg.style.width = "70px";
    todoimg.style.height = "50px";
    todoimg.style.margin =  "0 10px 0 10px";
    if (checkbox.checked) {
      todoTextNode.style.textDecoration = "line-through";
      todoPriority.style.textDecoration = "line-through";
    }
   
   
    div.appendChild(checkbox);
    div.appendChild(todoimg);    
    div.appendChild(todoTextNode);
    div.appendChild(todoPriority);
    div.appendChild(button);
    tasks.appendChild(div);


};
fetch("/todo-data")
  .then(function (response) {
    if (response.status === 200) {
      return response.json();
    } else {
      alert("something weird happened");
    }
  })
  .then(function (todos) {
    todos.forEach(function (todo) {
      showTodoInUI(todo);
    });
  
  });
  
  function handleDeleteClick(todo,todoDiv,delBtn) {
    delBtn.addEventListener("click", function () {
     
      // Delete the existing todo on the server
      fetch("/todo", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(todo),
      }).then(function (response) {
        if (response.status === 200) {
         
          todoDiv.remove();
        } 
        else if(response.status === 401){
          window.location.href="/login"
          //alert("please login first..!")
        }
        else {
          alert("Something went wrong");
        }
      });
    });
  }

  function handleCheckboxChange(todo, todoText, todoPrio, donecheckbox) {
    donecheckbox.addEventListener("change", function () {
      if (donecheckbox.checked) {
        todoText.style.textDecoration = "line-through";
        todoPrio.style.textDecoration = "line-through";
        todo.done = "done";
        fetch("/todo", {       
          method: "PUT", 
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(todo),
        }).then(function (response) {
          if (response.status === 200) {
           
          } else {
            alert("Something went wrong");
          }
        });
      } else {
        todoText.style.textDecoration = "none";
        todoPrio.style.textDecoration = "none";
        todo.done = "pending";
      }
  
      
    });
  }
  

  