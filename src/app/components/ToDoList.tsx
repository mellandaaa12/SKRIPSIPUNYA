"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getTodosByUser, createTodo, updateTodo, deleteTodo as deleteTodoAPI } from "../utils/api";

interface TodoItem {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export function ToDoList() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Get access token from localStorage
  const getAccessToken = () => {
    try {
      const session = JSON.parse(localStorage.getItem("supabase.auth.session") || "{}");
      return session?.access_token;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      loadTodos();
    }
  }, [user]);

  const loadTodos = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = getAccessToken();
      if (!token) {
        console.error("No access token found");
        return;
      }
      const data = await getTodosByUser(user.id, token);
      setTodos(data.todos || []);
    } catch (error) {
      console.error("Failed to load todos:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTodoHandler = async (id: string) => {
    try {
      const token = getAccessToken();
      if (!token) return;
      
      const todo = todos.find(t => t.id === id);
      if (!todo) return;
      
      await updateTodo(id, { completed: !todo.completed }, token);
      setTodos(todos.map(t => 
        t.id === id ? { ...t, completed: !t.completed } : t
      ));
    } catch (error) {
      console.error("Failed to toggle todo:", error);
    }
  };

  const deleteTodoHandler = async (id: string) => {
    try {
      const token = getAccessToken();
      if (!token) return;
      
      await deleteTodoAPI(id, token);
      setTodos(todos.filter(t => t.id !== id));
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  const addTodoHandler = async () => {
    if (!newTodo.trim() || !user) return;
    
    try {
      const token = getAccessToken();
      if (!token) {
        console.error("No access token found");
        return;
      }
      
      const result = await createTodo(newTodo, token);
      setTodos([result.todo, ...todos]);
      setNewTodo("");
      setIsAdding(false);
    } catch (error) {
      console.error("Failed to add todo:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="absolute left-[720px] top-[668px] w-[600px] h-[300px]">
      {/* Background */}
      <div className="absolute inset-0 bg-white rounded-[8px] shadow-[4px_4px_4px_0px_rgba(0,0,0,0.25)]" />
      
      {/* Title */}
      <div className="absolute left-[40px] top-[21px] right-[40px] flex justify-between items-center">
        <p className="font-['Poppins'] font-medium text-[15px] text-[#121212] tracking-[0.3px] leading-[23px]">
          To do List
        </p>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="w-[24px] h-[24px] bg-[#1294f2] text-white rounded-full flex items-center justify-center hover:bg-[#0d7ac7] transition-colors"
        >
          {isAdding ? "×" : "+"}
        </button>
      </div>

      {/* Scrollable List Container */}
      <div className="absolute left-[40px] right-[40px] top-[55px] bottom-[20px] overflow-y-auto">
        {/* Add New Todo Form */}
        {isAdding && (
          <div className="flex gap-[8px] mb-[16px] bg-white z-10 pb-[12px] border-b border-[#ECECEC]">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTodoHandler()}
              placeholder="Add new task..."
              className="flex-1 px-[12px] py-[8px] border border-[#e5e7eb] rounded-[8px] font-['Poppins'] text-[13px] focus:outline-none focus:border-[#1294f2]"
              autoFocus
            />
            <button
              onClick={addTodoHandler}
              className="px-[16px] py-[8px] bg-[#1294f2] text-white rounded-[8px] font-['Poppins'] text-[13px] hover:bg-[#0d7ac7] transition-colors"
            >
              Add
            </button>
          </div>
        )}

        <div className="flex flex-col gap-[0px]">
          {todos.map((todo, index) => (
            <div key={todo.id} className="py-[12px]">
              <div className="flex items-start gap-[20px] group">
                {/* Checkbox */}
                <button
                  onClick={() => toggleTodoHandler(todo.id)}
                  className={`w-[18px] h-[18px] mt-[3px] border transition-all flex items-center justify-center ${
                    todo.completed 
                      ? 'bg-[#08a0f7] border-[#08a0f7]' 
                      : 'bg-[rgba(8,160,247,0.06)] border-[#08a0f7] hover:bg-[rgba(8,160,247,0.15)]'
                  }`}
                >
                  {todo.completed && (
                    <svg className="w-[12px] h-[12px]" fill="none" viewBox="0 0 12 12">
                      <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                {/* Content */}
                <div className="flex-1">
                  <p className={`font-['Poppins'] font-medium text-[13px] text-[#121212] opacity-70 tracking-[0.5px] leading-[21px] ${
                    todo.completed ? 'line-through' : ''
                  }`}>
                    {todo.title}
                  </p>
                  <p className="font-['Poppins'] text-[12px] text-[#41475e] opacity-50 tracking-[0.3px] leading-[12px] mt-[3px]">
                    {formatDate(todo.createdAt)}
                  </p>
                </div>

                {/* Delete Button - Shows on hover */}
                <button
                  onClick={() => deleteTodoHandler(todo.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity w-[20px] h-[20px] mt-[3px] flex items-center justify-center text-[#e7000b] hover:bg-[#fee] rounded"
                >
                  <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 16 16">
                    <path d="M6.66667 7.33333V11.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9.33333 7.33333V11.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2 4H14M12.6667 4V13.3333C12.6667 13.687 12.5262 14.0261 12.2761 14.2761C12.0261 14.5262 11.687 14.6667 11.3333 14.6667H4.66667C4.31304 14.6667 3.97391 14.5262 3.72386 14.2761C3.47381 14.0261 3.33333 13.687 3.33333 13.3333V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5.33333 4V2.66667C5.33333 2.31304 5.47381 1.97391 5.72386 1.72386C5.97391 1.47381 6.31304 1.33333 6.66667 1.33333H9.33333C9.68696 1.33333 10.0261 1.47381 10.2761 1.72386C10.5262 1.97391 10.6667 2.31304 10.6667 2.66667V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              {/* Divider - except for last item */}
              {index < todos.length - 1 && (
                <div className="w-full h-[1px] bg-[#ECECEC] mt-[12px]" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}