import cssText from "data-text:~style.css"
import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useState } from "react"
import { sendToBackground } from "@plasmohq/messaging"




export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],

}


export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

const PlasmoOverlay = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [animation, setAnimation] = useState('');
  const [openContent, setOpenContent] = useState(false);


  useEffect(() => {

    chrome.runtime.onMessage.addListener((message) => {
      if (message.name === 'openContent') {
        setOpenContent(true);
        console.log(message.body)
      }
      if (message.name === 'closeContent') {
        setOpenContent(false);
        console.log(message.body)
      }
    })
  }, []);

  const handleGenerateClick = async () => {
    setOutput('');
    if(input.length<1)
    {
      setOutput('Looks like your prompt was empty! Please enter a prompt');
      return;
    }
    setLoading(true);
    fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      body: input,
    }).then((res) => {
      if (res.status === 503) {
        setOutput('Server is busy (the model is loading), please try again later');
      }
      return res.json();

    }).then((data) => {

      const str = (data[0].generated_text).split('\n').slice(2);
      if(str.length>0)
          setOutput(str.join('').trim()===''?'Sorry I did not understand that':str.join(''));
        

      else
        setOutput(data[0].generated_text)
      setAnimation('typing');
      setLoading(false);
    }).catch((err) => {
      
      setOutput(err.message)
      setLoading(false);


    });


  };
  

  return (openContent ?
    <div className="flex flex-col fixed w-screen h-screen justify-center items-center ">

      <div className=" relative rounded-md flex flex-col bg-[#fefff5] border border-[hsla(209, 100%, 50%, 0.28)] drop-shadow-2xl items-center  h-screen  " style={{ width: '500px', height: '500px' }}>
      <div onClick={
          () => {
            setOpenContent(false);
            sendToBackground({
              //@ts-expect-error
              name: "closeContent",
              body: {
                id: 123
              }
            })
          }
        } className="  flex p-3 justify-end cursor-pointer  w-full"><svg xmlns="http://www.w3.org/2000/svg" fill="black" className=" hover:bg-slate-500 hover:rounded-lg p-1 opacity-60 w-7 h-7 " viewBox="0 0 16 16">
            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z" />
          </svg></div>
        <div className="font-sans font-bold text-gray-500 text-xl">ChatGPT Writer</div>
        
        <div className="bg-white h-full w-full shadow-xl rounded-lg p-5" >
          <input
            type="text"
            value={input}
            onChange={(e) => {
              
              setInput(e.target.value)
            }}
            
            className="border bg-white  text-black border-gray-300 p-2 rounded w-full"
            placeholder="Enter your command"
            
          />
          <button 
            onClick={handleGenerateClick}
            className={`mt-4 p-2 text-white rounded w-full ${loading ? 'bg-gray-500' : 'bg-blue-500'}`}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
          <div className="mt-4 p-2 border  border-gray-300 rounded h-64 overflow-auto">


            <ChunkedOutput str={output} chunkSize={29} delay={1500} />

          </div>
        </div>
      </div></div> : null
  );
};


// Splits the string into chunks of required character
const ChunkedOutput = ({ str, chunkSize, delay }) => {
  const [substrings, setSubstrings] = useState([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);

  useEffect(() => {
    const chunks = splitStringIntoChunks(str, chunkSize);
    setSubstrings(chunks);
    // Set the initial chunk to be displayed
    setCurrentChunkIndex(1);
  }, [str, chunkSize]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentChunkIndex(current => {
        if (current < substrings.length) {
          return current + 1;
        }
        clearInterval(timer);
        return current;
      });
    }, delay);

    // Clear the interval on component unmount
    return () => clearInterval(timer);
  }, [substrings.length, delay]);

  const splitStringIntoChunks = (str, chunkSize) => {
    const words = str.split(' ');
    const chunks = [];
    let currentChunk = '';

    words.forEach(word => {
      if ((currentChunk.length + word.length) <= chunkSize) {
        currentChunk += word + ' ';
      } else {
        chunks.push(currentChunk.trim());
        currentChunk = word + ' ';
      }
    });

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  };

  return (
    <div>
      {substrings.slice(0, currentChunkIndex).map((substring, index) => (
        <div className='typing' key={index}>{substring}</div>
      ))}
    </div>
  );
};




export default PlasmoOverlay
