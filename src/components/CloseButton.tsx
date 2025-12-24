import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { sendToNative, detectNativeApp } from "@/lib/nativeCommunication";

const CloseButton = () => {
  const navigate = useNavigate();
  const nativeApp = detectNativeApp();

  const handleClose = () => {
    if (nativeApp.isNative) {
      if (nativeApp.platform === 'web') {
        // localhost에서 실행될 때는 이전 페이지로 이동
        navigate(-1);
      } else {
        // 네이티브 앱으로 돌아가기
        sendToNative({
          type: 'BACK_BUTTON_PRESSED',
          data: {
            timestamp: Date.now()
          }
        });
      }
    } else {
      // 웹에서만 실행될 때는 이전 페이지로 이동
      navigate(-1);
    }
  };


  return (
    <Button
      variant="ghost"
      size="lg"
      onClick={handleClose}
      className="
        text-neon-green 
        hover:bg-accent/20 
        p-4
        -mr-2.5
      "
      aria-label="뒤로가기"
    >
      <X className="h-10 w-10" />
    </Button>
  );
};

export default CloseButton;
