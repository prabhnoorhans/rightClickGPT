# NEW

from flask import Flask, request, Response, jsonify
import subprocess, shlex
import time

api = Flask(__name__)

@api.route('/audio', methods=['POST'])
def post_audio():
    au_fl=open('/a/tmp.webm','wb')
    au_fl.write(request.files['audio'].read())
    au_fl.close()
    subprocess.run("ffmpeg -y -i /a/tmp.webm -ar 16000 /a/tmp.wav", shell=True, capture_output=True)
    result=subprocess.run("/a/whisper.cpp/main --threads 16 -m /a/whisper.cpp/models/ggml-tiny.en.bin -f /a/tmp.wav", shell=True, capture_output=True)
    w_txt=result.stdout.decode().split(']')[1].strip()
    # w_txt=result.stdout.decode().split('[')[1].rstrip()
    resp=jsonify({'text':w_txt})

    return jsonify({'text':w_txt}), 200, {'Access-Control-Allow-Origin': '*'}

@api.route('/gpt', methods=['POST'])
def post_gpt():
    md_ctx = request.form.get("string2")
    md_query = request.form.get("string1")
    md_ai_name, md_user_name = "### Assistant", "### Human"
    md_name="/a/llama.cpp/models/vic/ggml_f32_q4_1.bin"
    md_prompt="""You are a very enthusiastic AI named {0}, who answers {1}'s question for provided **Input Text**! You should be concise with responses, and reply within range of 15-20 words. Do not exceed this range!

Input Text:
{2}

{1}: {3}
""".format(md_ai_name, md_user_name, md_ctx, md_query)
    md_cmd = "/a/llama.cpp/main --interactive --threads 16 --n_predict 2048 --ctx_size 2048 --temp 0.8 --top_k 40 --top_p 0.5 --repeat_last_n 256 --batch_size 1024 --repeat_penalty 1.17647 --model {} --reverse-prompt \"{}:\" --prompt \"{}\"".format(md_name, md_user_name, md_prompt)
    print(md_cmd)

    md_res = ""

    # return
    try:
        md_proc = subprocess.Popen(shlex.split(md_cmd), stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        while md_proc.poll() is None:
            line = md_proc.stdout.readline().decode("utf-8").strip()
            if (line.startswith("### Assistant")):
                print(line)
                md_res = line.lstrip("### Assistant: ")
                md_proc.terminate()
            time.sleep(0.2)
        # md_proc.wait()
    except KeyboardInterrupt:
        md_proc.terminate()


    return jsonify({'text':md_res}), 200, {'Access-Control-Allow-Origin': '*'}

if __name__ == '__main__':
    api.run(host='0.0.0.0', port=5000)