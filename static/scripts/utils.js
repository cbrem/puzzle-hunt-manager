/** assert: (expression, String)

 general assertion handler to automatically stop execution on assertion failure
 
 params:
 expr           any expression (will be tested based on its truthiness)
 errorMsg       the error message to display if the assertion fails 
                (optional)
**/
function assert(expr, errorMsg){
    if (!expr){
        if(errorMsg === undefined){
            errorMsg = "assertion error message not given";
        }
        
        throw("Assertion Error: " + errorMsg);
    }
}

function getObjectSize(object) {
	var size = 0;
  for (key in object) {
    if (object.hasOwnProperty(key)) 
    	size++;
  }
  return size;
}

function fillEach(selector, textContent){
    $(selector).each(function(i, elem){
        $(elem).text(textContent);
    });
}