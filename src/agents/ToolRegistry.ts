import Tools from '../utils/tools';
import AfterMath from '../protocols/aftermath/tools';
import Navi from '../protocols/navi/tools';
import Transaction from '../transactions/tools';
import Suilend from '../protocols/suilend/tools';
import Bluefin from '../protocols/bluefin/tools';
/* 
format for tool registry is:
tool name, tool description, tool arguments, process(function)
*/

export function registerAllTools(tools: Tools) {
  //after math tools
  AfterMath.registerTools(tools);
  //navi tools
  Navi.registerTools(tools);
  // Transaction Tools
  Transaction.registerTools(tools);
  
  // Suilend Tools
  Suilend.registerTools(tools);
  
  // Bluefin tools
  Bluefin.registerTools(tools);
}
