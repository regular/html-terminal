
#include <gtk/gtk.h>
#include <webkit2/webkit2.h>

#define FULLSCREEN
//#define INSPECTOR

const char* url = "http://localhost:9999/index.html";

static void destroyWindowCb(GtkWidget* widget, GtkWidget* window);
static gboolean closeWebViewCb(WebKitWebView* webView, GtkWidget* window);

int main(int argc, char* argv[])
{
    // Initialize GTK+
    gtk_init(&argc, &argv);

    GtkWidget *main_window = gtk_window_new(GTK_WINDOW_TOPLEVEL);

#ifdef FULLSCREEN
    gtk_window_fullscreen (GTK_WINDOW(main_window));
#else
    gtk_window_set_default_size(GTK_WINDOW(main_window), 1025, 800);
#endif

    // Create a browser instance
    WebKitWebView *webView = WEBKIT_WEB_VIEW(webkit_web_view_new());


    // Put the browser area into the main window
    gtk_container_add(GTK_CONTAINER(main_window), GTK_WIDGET(webView));

    // Set up callbacks so that if either the main window or the browser instance is
    // closed, the program will exit
    g_signal_connect(main_window, "destroy", G_CALLBACK(destroyWindowCb), NULL);
    g_signal_connect(webView, "close", G_CALLBACK(closeWebViewCb), main_window);

#ifdef INSPECTOR
    /* Enable the developer extras */
    WebKitSettings *settings = webkit_web_view_get_settings (WEBKIT_WEB_VIEW(webView));
    g_object_set (G_OBJECT(settings), "enable-developer-extras", TRUE, NULL);
#endif

    // Load a web page into the browser instance
    webkit_web_view_load_uri(webView, url);


    // Make sure that when the browser area becomes visible, it will get mouse
    // and keyboard events
    gtk_widget_grab_focus(GTK_WIDGET(webView));

    // Make sure the main window and all its contents are visible
    gtk_widget_show_all(main_window);

    /* Show the inspector */
#ifdef INSPECTOR
    WebKitWebInspector *inspector = webkit_web_view_get_inspector (WEBKIT_WEB_VIEW(webView));
    webkit_web_inspector_show (WEBKIT_WEB_INSPECTOR(inspector));
#endif

    // Run the main GTK+ event loop
    gtk_main();

    return 0;
}


static void destroyWindowCb(GtkWidget* widget, GtkWidget* window)
{
    gtk_main_quit();
}

static gboolean closeWebViewCb(WebKitWebView* webView, GtkWidget* window)
{
    gtk_widget_destroy(window);
    return TRUE;
}
