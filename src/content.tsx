import cssText from "data-text:~style.css"
import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { sendToBackground } from "@plasmohq/messaging"
import { TypeAnimation } from 'react-type-animation'
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
  const [output, setOutput] = useState<ReactNode>(null);
  const [loading, setLoading] = useState(false);
  const [animation, setAnimation] = useState('');
  const [openContent, setOpenContent] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);



  useEffect(() => {

    chrome.runtime.onMessage.addListener((message) => {
      if (message.name === 'openContent') {
        setOpenContent(true);
        setOutput(null);
        console.log(message.body)
      }
      if (message.name === 'closeContent') {
        setOpenContent(false);
        console.log(message.body)
      }
    })
  }, []);

  const handleGenerateClick = async () => {
    setOutput(null);
    if (input.length < 1) {
      setOutput(<div ref={outputRef} className="text-black"><TypeAnimation className="w-full" cursor={false} sequence={[
        "Please enter some text to generate",
        100
      ]} /></div>
      );
      return;
    }
    setLoading(true);
    try{
    const res = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      body: input,
    })
    
  
    const reader = res.body.getReader();
    const chunks = []

    const decoder = new TextDecoder();

    if (res.status !== 200) {
      
      setOutput(<div className="text-black"><TypeAnimation className="w-full" cursor={false} sequence={[
        "Something went wrong on server side",
        100
      ]} /></div>
      );
      
      setLoading(false);
      return;
    }
    
    reader.read().then(function processText({ done, value }) {
      if (done) {
        console.log('Stream complete');
        return;
      }
      const chunk = decoder.decode(value, { stream: true });

      if(chunk =='')
      {
        console.log('asdf')
        setOutput(<TypeAnimation  className="w-full" cursor={false} sequence={[
          "Sorry I didn't understand that",
          100
        ]} />
        );
        return;
      }
      

      setOutput(<div onClick={()=>
        console.log('sdf')
      }  className="text-black w-full "  ><TypeAnimation speed={80} cursor={true}  sequence={[
        chunk

      ]} /></div>);

      outputRef.current.click();

      // Read the next chunk
      reader.read().then(processText);
      setLoading(false)
    });

    setLoading(false);
  }catch(e)
  {
    setOutput(<div className="text-black"><TypeAnimation className="w-full" cursor={false} sequence={[
      "Something went wrong on server side",
      100
    ]} /></div>
    );
    setLoading(false);
  }


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
          <div className="mt-4 p-2 border  overflow-x-auto border-gray-300 rounded h-64 overflow-auto">


            {output}

          </div>
        </div>
      </div></div> : null
  );
};






export default PlasmoOverlay
