/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.codejive.websocket.wstestserver;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.eclipse.jetty.util.log.Log;
import org.eclipse.jetty.websocket.WebSocket;
import org.eclipse.jetty.websocket.WebSocketServlet;

public class WebSocketChatServlet extends WebSocketServlet {

    private final Set<ChatWebSocket> _members = new CopyOnWriteArraySet<ChatWebSocket>();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws javax.servlet.ServletException, IOException {
        getServletContext().getNamedDispatcher("default").forward(request, response);
    }

    @Override
    public void service(ServletRequest req, ServletResponse res) throws ServletException, IOException {
        super.service(req, res);
    }

    @Override
    protected WebSocket doWebSocketConnect(HttpServletRequest request, String protocol) {
        return new ChatWebSocket();
    }

    /* ------------------------------------------------------------ */
    /* ------------------------------------------------------------ */
    class ChatWebSocket implements WebSocket {

        Outbound _outbound;

        @Override
        public void onConnect(Outbound outbound) {
            Log.info(this+" onConnect");
            _outbound = outbound;
            _members.add(this);
        }

        @Override
        public void onMessage(byte frame, byte[] data, int offset, int length) {
            // Log.info(this+" onMessage: "+TypeUtil.toHexString(data,offset,length));
        }

        @Override
        public void onMessage(byte frame, String data) {
            Log.info(this+" onMessage: "+data);
            for (ChatWebSocket member : _members) {
                try {
                    member._outbound.sendMessage(frame, data);
                } catch (IOException e) {
                    Log.warn(e);
                }
            }
        }

        public void onDisconnect() {
            Log.info(this+" onDisconnect");
            _members.remove(this);
        }
    }
}
