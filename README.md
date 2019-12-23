# swe574_annotationServer
SWE 574 - Fall 2019: Annotation Server

# Annotation System
## Parts
Annotation system consist of three components; annotation creator chrome extension, annotation reader chrome extension, and annotation server.
### Annotation Creator Chrome Extension
This extension only creates annotations and sends them to annotation server. Annotation creation is done in "annotation.js" file and sending and receiving annotations are handled in "eventScript.js" file. The actions are triggered by page events (such as mouse-up or right-click events) on "eventScript.js" file. After detection of these events a message is transferred over chrome message protocol with a port number to create an annotation data (this is represented by create data (annotation) in the diagram). This data then transferred to "annotation.js" file by chrome messaging. There it is sent to annotation server with or without a token to perform a db writing operation. The creator extension is not responsible for any annotation reading and that's part of the next section.

![](https://eksiup.com/images/42/56/tk313961dxyr.png)

### Annotation Reader Chrome Extension
Annotation reader extension is responsible only for retrieving annotations and showing them on the page. This is achieved by similar process of annotation creation extension. Here we instead have "highlight.js" file and we interact with it again by "eventScript.js" file. After login, a token is received and stored in local storage. We make our get annotation request to "eventScript.js" file and our request directly pushed to annotation server. If we have valid token we get our personal annotations with public ones. Otherwise we get only public ones. Then from event script our annotations are transferred to "highlight.js" file. Here, we find exact annotation location with XPathSelector and exact phrase match combination, then modify the web page with span elements to cover selected text in the html file, and give css attributes them to highlight it.

![](https://eksiup.com/images/12/97/pt3139624p6h.png)

### Annotation Server
Annotation server is responsible for three actions: registering users, listing annotations, and deleting annotations. We use EJS template engine for our frontend and Express framework for our backend. BcryptJS package for encryption of user passwords and PassportJS for session management with Bearer tokens. All user, session and annotation data are stored in firebase realtime database service. 

![](https://eksiup.com/images/31/26/je3139633vpo.png)
