/**
 * 指令: 提示用户进行某些行为，比如点头、张嘴
 */
interface Instruction {
  startSeconds: number;
  text?: string;
  audioUrl?: string;
}

export function captureVideo({
  width,
  height,
  onComplete,
  previewElement,
  seconds,
  instructions,
  withStream,
}: {
  width: number;
  height: number;

  /**
   * Complete capture
   * @param blob
   */
  onComplete(blob: Blob): void;

  /**
   * Preview
   */
  previewElement?: HTMLVideoElement;

  /**
   * Manual stop from stream if not specified
   */
  seconds?: number;

  /**
   * Audio instruction when video capturing
   */
  instructions?: Instruction[];

  /**
   * more control with stream
   * @param stream
   */
  withStream?(stream: MediaStream): void;
}) {
  navigator.getUserMedia(
    { audio: false, video: { width, height, facingMode: 'user' } },
    function(stream) {
      if (withStream) {
        withStream(stream);
      }

      if (previewElement) {
        previewElement.srcObject = stream;
        previewElement.play();
      }

      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.addEventListener('start', function(_) {
        if (instructions && instructions.length) {
          instructions.forEach(instruction =>
            setTimeout(
              () =>
                speak({
                  text: instruction.text,
                  audioUrl: instruction.audioUrl,
                }),
              instruction.startSeconds * 1000
            )
          );
        }
      });

      recorder.addEventListener('dataavailable', function(ev) {
        chunks.push(ev.data);
      });

      recorder.addEventListener('stop', function(_) {
        const blob = new Blob(chunks, { type: 'video/mp4' });
        onComplete(blob);
        stream.getTracks().forEach(track => track.stop());
      });

      recorder.start();

      if (seconds) {
        setTimeout(() => recorder.stop(), seconds * 1000);
      }
    },
    function(_) {}
  );
}

function speak({ text, audioUrl }: { text?: string; audioUrl?: string }) {
  if (supportSpeechSynthesis()) {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
  } else {
    console.log(audioUrl);
  }
}

function supportSpeechSynthesis() {
  return true;
}
