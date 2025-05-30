import axios from "axios";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { marked } from "marked";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import logo from "../image/minemi-logo.png";

export default function Index() {
  const [isOpen, setIsOpen] = useState(false);
  const [creditScore, setCreditScore] = useState(null);
  const [activeLoan, setActiveLoan] = useState(null);
  const [foir, setFoir] = useState(null);
  const [userName, setUserName] = useState("");
  const [greetings, setGreetings] = useState("");
  const [questions, setQuestions] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  // const [token, setToken] = useState("");

  const [showContent, setShowContent] = useState(true);
  const [chatHistory, setChatHistory] = useState([]);
  const [questionList, setQuestionList] = useState([]);

  const [open, setOpen] = React.useState(false); // this is chatlisting remove open

  useEffect(() => {
    const storeToken = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search); // only works in WebView
        const tokenFromUrl = urlParams.get("token");

        // console.log(tokenFromUrl,"")
        if (tokenFromUrl) {
          // setToken(tokenFromUrl);
          await AsyncStorage.setItem("authToken", tokenFromUrl);
        }
      } catch (error) {
        console.error("Error accessing/storing token:", error);
      }
    };

    storeToken();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        console.warn("Token not found in URL.");
        return;
      }
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}api/minemi/chat`,
          {
            params: { token: token },
          }
        );

        const data = response.data;
        // console.log(data)
        setCreditScore(data.creditScore);
        setActiveLoan(data.activeLoan);
        setFoir(data.foir);
        setUserName(data.userName);
        setGreetings(data.greetings);
        setQuestions(data.questions);
      } catch (error) {
        console.error("API Error:", error);
      }
    };

    fetchData();
  }, []);
  const handleSetIsOpen = () => {
    setIsOpen(!isOpen);
    setChatId(crypto.randomUUID());
  };

  const handleClose = () => {
    setOpen(false);
  };

  // this is for new chat button
  const handleNewChat = () => {
    setChatHistory([]); // Clear all chat history
    setShowContent(true); // Show the welcome screen again
    setInputValue(""); // Clear input field
    setChatId(crypto.randomUUID()); // Generate a new unique ID
    console.log(chatId);
  };

  const DEFAULT_ANSWER =
    "Thank you for your question! Our AI advisor is processing it and will provide guidance shortly.";

  // const token =
  //   "eyJpdiI6IkEzOUFyei9idlp1SGF2UmVQNzdBVXc9PSIsInZhbHVlIjoiNzBWNlVhYTVDcTVEbW1vOER1clFKdz09IiwibWFjIjoiZmY5NzA4NzA3MjBmNjk1OGQxNmY0NDQ4MmUwMmM1NjEwNTBkZTM3OTBjOTExZDM0ODAxZTFlNWM3ZGM3YTgxMSIsInRhZyI6IiJ9";
  // const chatId = 1;

  const [chatId, setChatId] = useState(() => crypto.randomUUID());

  useEffect(() => {
    const list = async () => {
      try {
        // const response = await axios.get(import.meta.env.VITE_LIST_URL);
        const token = await AsyncStorage.getItem("authToken");
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}api/minemi/chatlisting`,
          {
            params: { token: token },
          }
        );
        // console.log(response.data.data);
        setQuestionList(response.data.data);
      } catch (error) {
        console.error("API Error:", error);
      }
    };
    list();
  }, []);

  //  console.log(questionList,"question is ")
  const handleQuestionListClick = async (question, selectedChatId) => {
    setChatHistory([]);
    setShowContent(false);
    setInputValue("");
    setChatId(selectedChatId);
    console.log(chatId);

    try {
      const token = await AsyncStorage.getItem("authToken");

      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}api/minemi/chatdetails`,
        {
          params: {
            token: token,
            chatId: selectedChatId,
          },
        }
      );

      setChatHistory(response.data.data);
      // console.log("chatHistory", response.data.data);
    } catch (error) {
      // console.error("Error fetching chat history:", error);
    }
  };

  const handleSend = async (question) => {
    const finalQuestion = question || inputValue.trim();
    if (!finalQuestion) return;

    // navigate("/answer", { state: { answer: "adsfsdfdsfsdf" } });
    const userMessage = { type: "question", text: finalQuestion };
    setChatHistory((prev) => [...prev, userMessage]);
    setShowContent(false);
    setIsLoading(true); // Set loading to true when sending message

    try {
      // const urlParams = new URLSearchParams(window.location.search);
      // const token = urlParams.get("token");
      const token = await AsyncStorage.getItem("authToken");

      if (!token) {
        console.warn("Token not found in URL.");
        setIsLoading(false); // Turn off loading if no token
        return;
      }
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}api/minemi/chatConvo`,
        {
          question: finalQuestion,
        },
        {
          params: {
            token: token,
            chatId: chatId,
          },
        }
      );

      // for testing purpose

      const renderer = new marked.Renderer();

      function formatToMarkdown(rawText) {
        let markdown = rawText.replace(/(\d+)\.\s/g, "\n$1. ");

        markdown = markdown.replace(
          /(Pay Down Existing Balances|Avoid New Debt|Increase Credit Limits|Consolidate Debt|Make Multiple Payments Monthly|Monitor Your Credit Report|Set a Budget)/g,
          "**$1**"
        );

        return markdown;
      }

      const rawResponse = response.data.response || DEFAULT_ANSWER;
      const markdown = formatToMarkdown(rawResponse); // Format to Markdown

      const reply = {
        type: "answer",
        html: `
          <div class="chatgpt-reply">
            ${marked.parse(markdown, { renderer })}
          </div>
        `,
      };

      // new chat from new chat button

      setChatHistory((prev) => [...prev, reply]);
    } catch (error) {
      console.error("API Error:", error);
      const errorReply = {
        type: "answer",
        text: "Sorry, something went wrong. Please try again later.",
      };
      setChatHistory((prev) => [...prev, errorReply]);
    } finally {
      setIsLoading(false); // Always turn off loading when done
    }
    setInputValue("");
  };

  const handleSuggestedClick = (question) => {
    handleSend(question);
    setChatId(crypto.randomUUID()); // Generate a new unique ID
    // console.log(chatId)
  };

  const [chatIdToDelete, setChatIdToDelete] = useState(null);

  const handleClickOpen = (chatId) => {
    setChatIdToDelete(chatId); // store for later use
    setOpen(true); // open confirmation dialog
  };
  // console.log(chatIdToDelete)

  const handleDeleteChat = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      // await axios.delete(`${import.meta.env.VITE_DELETE_URL}/${chatIdToDelete}`);3

      await axios.delete(
        `${
          import.meta.env.VITE_BASE_URL
        }api/minemi/chatdelete/${chatIdToDelete}`
      );

      setQuestionList((questionList) =>
        questionList.filter((chat) => chat.chatId !== chatIdToDelete)
      );
      setOpen(false); // close confirmation dialog
      setChatIdToDelete(null); // reset
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  // Loading indicator component
  const LoadingIndicator = () => (
    <div className="flex justify-start mb-4">
      <div className="bg-gray-200 text-gray-800 rounded-lg px-4 py-2 max-w-[85%]">
        <div className="flex items-center space-x-2">
          <div
            className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          ></div>
          <div
            className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          ></div>
          <div
            className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
            style={{ animationDelay: "600ms" }}
          ></div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* <div style={{height:70,backgroundColor:'black'}}></div> */}
      <div className="flex h-screen bg-gray-100 w-full overflow-hidden">
        {/* Sidebar */}
        <div className="w-[21%] bg-[#F3F0FB] shadow-md hidden lg:block">
          <div className="h-[70px] bg-white flex justify-center items-center">
            <div className="border w-[90%] h-[55%] rounded">
              <div
                className="px-4 py-1 cursor-pointer font-medium text-gray-600"
                onClick={handleNewChat}
              >
                <button>+ New Chat</button>
              </div>
            </div>
          </div>

          {/* Bottom: Chat List start here */}
          <div className="flex-1 overflow-y-auto mt-2 px-4 space-y-2 h-screen">
            <div className="bg-white mt-2 overflow-y-scroll p-2 rounded shadow text-sm cursor-pointer h-[90%] hide-scrollbar">
              {questionList.map((item, ind) => (
                <div
                  key={ind}
                  className="flex items-center justify-between border p-2 rounded-md m-1"
                >
                  <p
                    className="whitespace-nowrap overflow-hidden text-ellipsis mr-2 flex-1"
                    onClick={() =>
                      handleQuestionListClick(item.question, item.chatId)
                    }
                  >
                    {item.question}
                  </p>

                  <button className="text-purple-500 h-5 hover:text-purple-900 text-xs">
                    <ion-icon
                      className="h-4 w-4 p-1"
                      onClick={() => handleClickOpen(item.chatId)}
                      name="trash-outline"
                    ></ion-icon>
                  </button>
                </div>
              ))}
            </div>

            {/* chat history end here ... */}
          </div>
        </div>

        {/* Mobile Sidebar */}
        <div className="">
          <div className="relative h-screen overflow-hidden z-999 inset:0 lg:hidden">
            <div
              className={`fixed top-0 left-0 h-full w-80 bg-[#F3F0FB] shadow-md transform transition-transform duration-300 z-50 ${
                isOpen ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              <div className="h-[70px] bg-white flex justify-center items-center border-b">
                <div className="border w-[90%] h-[55%] rounded">
                  <div
                    className="px-4 py-1 cursor-pointer font-medium text-gray-600 hover:text-white"
                    onClick={handleNewChat}
                  >
                    <button>+ New Chat</button>
                  </div>
                </div>
              </div>

              {/* Bottom: Chat List start here */}
              <div className="flex-1 overflow-y-auto mt-2 px-4 space-y-2 h-screen">
                <div className="bg-white mt-2 overflow-y-scroll p-2 rounded shadow text-sm cursor-pointer h-[90%] hide-scrollbar">
                  {questionList.map((item, ind) => (
                    <div
                      key={ind}
                      className="flex items-center justify-between border p-2 rounded-md m-1"
                    >
                      <p
                        className="whitespace-nowrap overflow-hidden text-ellipsis mr-2 flex-1"
                        onClick={() =>
                          handleQuestionListClick(item.question, item.chatId)
                        }
                      >
                        {item.question}
                      </p>

                      <button className="text-purple-500 h-5 hover:text-purple-900 text-xs">
                        <ion-icon
                          className="h-4 w-4 p-1"
                          onClick={() => handleClickOpen(item.chatId)}
                          name="trash-outline"
                        ></ion-icon>
                      </button>
                    </div>
                  ))}
                </div>

                {/* chat history end here ... */}
              </div>
            </div>

            <button
              className={`fixed top-1/2 left-0 w-8 h-8 z-50 transform -translate-y-1/2 bg-white border border-gray-300 rounded-full p-1 shadow-md transition-transform flex justify-center items-center`}
              onClick={handleSetIsOpen}
            >
              <ion-icon
                name={
                  isOpen ? "chevron-back-outline" : "chevron-forward-outline"
                }
                className="text-lg"
              ></ion-icon>
            </button>

            {isOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-40 z-40"
                onClick={() => setIsOpen(false)}
              ></div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-[#F0F5FF] rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          {/* <div className="border-b shadow-sm flex justify-between items-center min-h-[70px] bg-white py-4 px-6 sticky top-0 z-10">
            <div className="flex items-center gap-5">
              <ion-icon
                name="arrow-back-outline"
                onClick={() => window.history.back()}
                className="cursor-pointer"
              ></ion-icon>
              <div>
                <h1 className="text-sm sm:text-xl font-semibold text-[#55266d]">
                  AI Financial Advisor
                </h1>
                <p className="text-sm text-gray-600">
                  Credit Score: {creditScore || "N/A"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="bg-[#E1EDFE] font-semibold px-2 py-1 text-gray-500 rounded-full text-xs sm:text-sm">
                FOIR: {foir || "N/A"}
              </span>
              <span className="text-gray-600 bg-green-50 px-3 py-1 rounded-full text-xs sm:text-sm">
                Active: {activeLoan || "N/A"}
              </span>
            </div>
          </div> */}

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto h-full relative">
            <div className="bg-white object-fit m-1 md:m-4 rounded-md">
              <div className="bg-white p-1 md:p-4 rounded-md">
                {showContent ? (
                  <div className="bg-[#F4F8FD] h-full border border-purple-100 rounded-lg px-0 py-5 md:p-6">
                    <div className="bg-white p-3 md:p-6 rounded-xl mx-2">
                      <div className="flex items-center space-x-3 mb-4 bg">
                        <img
                          style={{
                            width: 40,
                            height: 40,
                            backgroundColor: "white",
                          }}
                          src={logo}
                          alt="Ai"
                        />
                        <h2 className="text-md md:text-2xl font-medium text-[#55266d]">
                          Your Personal Financial AI Advisor
                        </h2>
                      </div>
                      <p className="text-gray-600 font-medium text-sm md:text-lg mb-2">
                        👋 Hey there, Welcome to Minemi AI!
                      </p>
                      <p className="text-gray-600 mb-4 text-xs md:text-lg">
                        ✨ We see your credit score is{" "}
                        <strong>{creditScore}</strong> and you have{" "}
                        <strong>{activeLoan} active loans</strong>.
                      </p>
                      <p className="text-gray-600 mb-1 md:mb-2 text-xs md:text-[17px] leading-1">
                        Let's explore ways to reduce EMIs, boost your score, or
                        find top-up options.
                      </p>
                    </div>

                    <p className="text-sm font-semibold md:text-[16px] mx-2 text-gray-800 mt-5 flex flex-row items-center space-x-1">
                      <ion-icon
                        name="trending-up-outline"
                        className="h-5 w-5 text-purple-800"
                      ></ion-icon>
                      <span>
                        Let's start with some personalized questions based on
                        your profile:
                      </span>
                    </p>

                    <div className="space-y-3 mx-2 mt-5">
                      {questions.length === 0 ? (
                        <div className="text-red-500 text-center font-semibold text-sm">
                          User Not Found
                        </div>
                      ) : (
                        questions.map((question, index) => (
                          <div
                            key={index}
                            onClick={() => handleSuggestedClick(question)}
                            className="text-xs text-black hover:text-black md:text-[15px] border hover:border-purple-300 bg-white text-[26292b] px-4 py-4 lg:py-6 rounded-md cursor-pointer p-6 hover:drop-shadow-[0_4px_6px_rgba(200,150,255,0.6)]"
                          >
                            {question}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  //  <Chat props={chatHistory} loading={isLoading}/>
                  <div className="bg-[#F4F8FD] border border-purple-100 rounded-lg p-5 md:p-6 space-y-4">
                    {chatHistory?.map((msg, i) => {
                     
                      return (
                        <div
                          key={i}
                          className={`flex flex-col ${
                            msg.type === "question"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          {msg.question ? (
                            <p className="self-end max-w-[85%] text-xs md:text-[15px] bg-slate-300 hover:bg-purple-700 hover:text-white text-[#26292b] px-4 py-4 rounded-md cursor-pointer transition inline-block font-semibold mb-1">
                              {msg.question}
                            </p>
                          ) : null}
                          <div
                            className={`max-w-[85%] px-4 py-2 my-2 rounded-lg 
                                    ${
                                      msg.type === "question"
                                        ? "bg-slate-300 text-purple-900 ml-auto"
                                        : "bg-gray-200 text-gray-800 mr-auto"
                                    }`}
                          >
                            {msg.type === "answer" ? (
                              <div
                                dangerouslySetInnerHTML={{ __html: msg?.html }}
                              />
                            ) : (
                              msg.text
                            )}
                            {msg.answer && (
                              <div
                                className="chatgpt-reply mb-1 px-2 py-3 ml-4 rounded-md max-w-[100%] prose prose-sm prose-p:my-2 prose-p:mt-1 prose-ul:pl-5 prose-li:marker:text-purple-500"
                                dangerouslySetInnerHTML={{
                                  __html: marked?.parse(msg?.answer),
                                }}
                              ></div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Show loading indicator when waiting for reply */}
                    {isLoading && <LoadingIndicator />}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}

          <footer className="justify-center items-center w-full bg-gradient-to-r from-[#9133EA] to-[#2A61EB] h-[70px] sticky bottom-0 z-10 border-t px-3 hidden lg:flex">
            <div className="flex items-center border rounded-lg w-[85%] h-[65%] overflow-hidden shadow-sm bg-white">
              <input
                type="text"
                placeholder="Type your financial question..."
                className="flex-1 px-4 h-full w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && inputValue.trim()) {
                    handleSend();
                  }
                }}
                disabled={isLoading} // Disable input while loading
              />
            </div>
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !inputValue.trim()} // Disable button while loading or empty input
              className={`ml-2 py-2 px-4 rounded text-white transition-colors duration-300 ${
                inputValue.trim() && !isLoading
                  ? "bg-[#59266d]"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="w-8 h-4">
                  <ion-icon
                    style={{ transform: "rotate(-45deg)" }}
                    name="send-outline"
                  ></ion-icon>
                </span>
              )}
            </button>
          </footer>
        </div>
      </div>

      <footer className="flex justify-center items-center w-full bg-[#331664] h-[70px] sticky bottom-0 z-10 border-t pl-3 pr-3 lg:hidden">
        <div className="flex items-center border rounded-lg w-[85%] h-[65%] overflow-hidden shadow-sm bg-white">
          <input
            type="text"
            placeholder="Type your financial question..."
            className="flex-1 px-4 h-full w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && inputValue.trim()) {
                handleSend();
              }
            }}
            disabled={isLoading} // Disable input while loading
          />
        </div>
        <button
          onClick={() => handleSend()}
          disabled={isLoading || !inputValue.trim()} // Disable button while loading or empty input
          className={`ml-2 py-2 px-4 rounded text-white transition-colors duration-300 ${
            inputValue.trim() && !isLoading
              ? "bg-[#59266d]"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <span className="w-8 h-4">
              <ion-icon
                style={{ transform: "rotate(-45deg)" }}
                name="send-outline"
              ></ion-icon>
            </span>
          )}
        </button>
      </footer>
 <Dialog
        open={open}
        onClose={handleClose}
        // PaperComponen={PaperComponent}
        aria-labelledby="draggable-dialog-title"
        slotProps={{
          paper: {
            sx: {
              padding: "5px",   maxWidth: "400px",
              borderRadius: "15px", // Your desired border radius
            },
          },
        }}
      >
        <span className="border-b border-gray-400">
          <DialogTitle
            sx={{ cursor: "text", borderRadius: "40px",  fontWeight: "bold",    
    fontSize: "1.18rem",  textAlign: "center",      }}
            id="draggable-dialog-title"
          >
            <p><ion-icon className="text-red-700 text-3xl rounded-full bg-red-200 p-2" name="warning-outline"></ion-icon></p>
             Delete Chat?
          </DialogTitle>
        </span>
        <DialogContent>
          <DialogContentText>
            <span className="text-gray-800 block text-center max-w-[280px]">
              Are you sure you want to delete this chat? This action cannot be undone.
            </span>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <div className="w-48 flex justify-between text-md">
           <button
              autoFocus
              onClick={handleClose}
              className="border border-gray-400 ml-8 text-black py-1 px-3 rounded-xl bg-gray-200 hover:bg-gray-400 transition duration-300 ease-in-out cursor-pointer focus:outline-none  focus:ring-gray-500 hover:scale-110"
            >
              Cancel
            </button>

            <button
              className="text-white  bg-red-600 py-1 px-3 rounded-xl hover:bg-red-800 transition duration-300 ease-in-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 hover:scale-110"
              onClick={handleDeleteChat}
            >
              Delete
            </button>
          </div>
        </DialogActions>
      </Dialog>
    </>
  );
}
