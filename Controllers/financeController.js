const { text } = require("express");
const financeModel = require("../Models/financeModel.js");

async function getExpenditureGoalByID(req, res) {
  try {
    const accountId = req.user.id;
    const result = await financeModel.getExpenditureGoalByID(accountId);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No expenditure goal found for this account." });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching expenditure goal:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function getExpenditureGoalPerCategoryMonth(req, res) {
  try {
    const accountId = req.user.id;
    const month = req.params.month; // 'YYYY-MM'

    const result = await financeModel.getExpenditureGoalPerCategoryMonth(accountId, month);

    if (!result || result.length === 0) {
      return res.status(404).json({ message: "No expenditure records found for this month." });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching expenditure per category:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function getTotalExpenditureByID(req, res) {
  try {
    const accountId = req.user.id;
    const result = await financeModel.getTotalExpenditureByID(accountId);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No expenditure records found for this account." });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching total expenditure:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function getMonthlyExpenditureByID(req, res) {
  try {
    const accountId = req.user.id;
    const recordset = await financeModel.getMonthlyExpenditureByID(accountId);

    if (!recordset || recordset.length === 0) {
      return res.status(404).json({ message: "No monthly expenditure records found for this account." });
    }

    res.status(200).json(recordset);
  } catch (error) {
    console.error("Error fetching monthly expenditure:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function getExpenditureByMonthBarChart(req, res) {
  try {
    const userId = req.user.id;

    const data = await financeModel.getMonthlyExpenditureByID(userId);

    if (!Array.isArray(data)) {
      return res.status(500).json({ message: "Invalid data format from DB" });
    }

    const recentData = data
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);

    const monthLabels = recentData.map(entry => {
      const [year, month] = entry.month.split('-');
      return new Date(`${year}-${month.padStart(2, '0')}-01`).toLocaleString('default', { month: 'long' });
    });

    const amounts = recentData.map(entry => entry.total);
    const minValue = Math.min(...amounts);
    const maxValue = Math.max(...amounts);
    const yMin = Math.max(0, Math.floor(minValue * 0.8));

    // Color assignment: latest month is dark blue, others are light blue
    const backgroundColors = recentData.map((_, index) =>
      index === recentData.length - 1 ? 'rgb(129, 199, 190)' : 'rgba(200, 250, 242, 1)'
    );

    const chartData = {
      type: 'bar',
      data: {
        labels: monthLabels,
        datasets: [{
          label: 'Monthly Expenditure (S$)',
          data: amounts,
          backgroundColor: backgroundColors,
          borderRadius: 20,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Monthly Spending Overview (Last 5 Months)'
          },
          legend: {
            display: false
          }
        },
        layout: {
          padding: { bottom: 10 }
        },
        scales: {
          y: {
            beginAtZero: false,
            min: yMin,
            max: Math.ceil(maxValue * 1.05),
            title: {
              display: true,
              text: 'Amount (S$)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Month'
            }
          }
        }
      }
    };

    const chartUrl = 'https://quickchart.io/chart?c=' + encodeURIComponent(JSON.stringify(chartData)) + '&version=3';

    res.json({ chartUrl });
  } catch (error) {
    console.error("Error generating chart:", error);
    res.status(500).json({ message: "Failed to generate chart" });
  }
}


async function getAllTransactionsByID(req, res) {
  try {
    const accountId = req.user.id;
    const transactions = await financeModel.getAllTransactionsByID(accountId);

    if (!transactions || transactions.length === 0) {
      return res.status(404).json({ message: "No transactions found for this account." });
    }

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function getBudgetExpenditureDoughnutChart(req, res) {
  try {
    const userId = req.user.id;
    const month = req.params.month; // 'YYYY-MM'

    const { transactions, total } = await financeModel.getExpenditureForMonth(userId, month);
    let budgetData = await financeModel.getAccountBudget(userId, month);

    if (!budgetData || budgetData.monthly_goal == null) {
      budgetData = { monthly_goal: 0 };
    }

    const totalSpent = parseFloat(total) || 0;
    const budget = parseFloat(budgetData.monthly_goal) || 0;
    const remaining = Math.max(budget - totalSpent, 0);

    let spentPercentage = 0;
    let remainingPercentage = 0;

    if (budget > 0) {
      spentPercentage = ((totalSpent / budget) * 100).toFixed(2);
      remainingPercentage = ((remaining / budget) * 100).toFixed(2);
    } else {
      spentPercentage = 100;
      remainingPercentage = 0;
    }

    let chartData = null;

    // CASE 1: No budget set
    if (budget === 0) {
      chartData = {
        type: 'doughnut',
        data: {
          labels: ['Spent'],
          datasets: [{
            data: [totalSpent, 0],
            backgroundColor: ['#86DAD5']
          }]
        },
        options: {
          rotation: 185,
          cutout: '50%',
          plugins: {
            title: {
              display: true,
              text: 'Monthly Budget Usage'
            },
            legend: {
              position: 'bottom'
            },
            doughnutlabel: {
              labels: [
                { text: `$${totalSpent.toFixed(2)}`, font: { size: 24, weight: 'bold' } },
                { text: 'No Budget Set', font: { size: 18 } }
              ]
            }
          }
        },
        plugins: ['datalabels', 'doughnutlabel']
      };
    }

    // CASE 2: Overspent
    else if (totalSpent > budget) {
      let overshot = totalSpent;
      let overshotCounter = 0;
      while (overshot > budget && budget > 0) {
        overshot -= budget;
        overshotCounter++;
      }

      const overshotRemaining = Math.max(budget - overshot, 0);

      chartData = {
        type: 'doughnut',
        data: {
          labels: ['Overshot', 'Remaining'],
          datasets: [{
            data: [parseFloat(overshot.toFixed(2)), parseFloat(overshotRemaining.toFixed(2))],
            backgroundColor: ['#ff1d1dff', '#86DAD5']
          }]
        },
        options: {
          rotation: 185,
          cutout: '50%',
          plugins: {
            title: {
              display: true,
              text: 'Monthly Budget Usage'
            },
            legend: {
              position: 'bottom'
            },
            doughnutlabel: {
              labels: [
                { text: `$${totalSpent.toFixed(2)}`, font: { size: 24, weight: 'bold' } },
                { text: `/$${budget.toFixed(2)}`, font: { size: 18 } },
                { text: `${overshotCounter} times of Budget`, font: { size: 18 } }
              ]
            }
          }
        },
        plugins: ['datalabels', 'doughnutlabel']
      };
    }

    // CASE 3: Normal spending
    else {
      chartData = {
        type: 'doughnut',
        data: {
          labels: ['Spent', 'Remaining'],
          datasets: [{
            data: [parseFloat(totalSpent.toFixed(2)), parseFloat(remaining.toFixed(2))],
            backgroundColor: ['#86DAD5', '#EAF8F6']
          }]
        },
        options: {
          rotation: 185,
          cutout: '50%',
          plugins: {
            title: {
              display: true,
              text: 'Monthly Budget Usage'
            },
            legend: {
              position: 'bottom'
            },
            doughnutlabel: {
              labels: [
                { text: `$${totalSpent.toFixed(2)}`, font: { size: 24, weight: 'bold' } },
                { text: `/$${budget.toFixed(2)}`, font: { size: 18 } }
              ]
            }
          }
        },
        plugins: ['datalabels', 'doughnutlabel']
      };
    }

    if (budget === 0) {
      chartData = {
        type: 'doughnut',
        data: {
          labels: [],
          datasets: [{
            data: [totalSpent], // Single dummy value
            backgroundColor: ['#e0e0e0']
          }]
        },
        options: {
          cutout: '50%',
          rotation: 0,
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: 'Monthly Budget Usage'
            },
            doughnutlabel: {
              labels: [
                {
                  text: 'No Budget',
                  font: { size: 20, weight: 'bold' },
                  color: '#333'
                },
                {
                  text: 'Set',
                  font: { size: 18 },
                  color: '#666'
                }
              ]
            }
          }
        },
        plugins: ['datalabels', 'doughnutlabel']
      };
    }

    const chartUrl = 'https://quickchart.io/chart?c=' + encodeURIComponent(JSON.stringify(chartData));

    res.json({
      chartUrl,
      totalSpent: totalSpent.toFixed(2),
      remaining: remaining.toFixed(2),
      budget: budget.toFixed(2),
      spentPercentage,
      remainingPercentage
    });

  } catch (error) {
    console.error("Error generating budget doughnut chart:", error);
    res.status(500).json({ message: "Failed to generate budget chart" });
  }
}


async function addTransactionToAccount(req, res) {
  try {
    const accountId = req.user.id;
    const { amount, date, description, category } = req.body;

    if (!amount || !date || !description || !category) {
      return res.status(400).json({ message: "All fields are required." });
    }

    let transaction = {
      amount: parseFloat(amount),
      date: date,
      description: description.trim(),
      category: category.trim()
    };

    const result = await financeModel.addTransactionToAccount(accountId, transaction);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error adding transaction:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Modify `updateExpenditureGoal` to handle both update and insert operations
async function updateExpenditureGoal(req, res) {
  const accountId = req.user.id; // Get account ID from the user object
  const monthly_Goal = req.body; // Get new goal from request body

  const currentMonth = new Date().toLocaleDateString('sv-SE').slice(0, 7);

  try {
    // Check if an expenditure goal already exists for this account
    const existingGoal = await financeModel.getExpenditureGoalByID(accountId);

    if (existingGoal.rows.length > 0) {
      // If a goal exists, update it
      await financeModel.modifyExpenditureGoal(accountId, monthly_Goal, currentMonth);
      return res.status(200).json({ message: "Expenditure goal updated successfully." });
    } else {
      // If no goal exists, create a new one
      await financeModel.addExpenditureGoal(accountId, monthly_Goal, currentMonth);
      return res.status(201).json({ message: "Expenditure goal created successfully." });
    }

  } catch (error) {
    console.error("Error updating expenditure goal:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function getTransactionByID(req, res) {
  try {
    const transactionId = req.params.id;
    const accountId = req.user.id; // Ensure that req.user.id is populated correctly from authentication

    // Pass accountId and transactionId to the model method
    const transaction = await financeModel.getTransactionByID(accountId, transactionId);

    if (!transaction || transaction.length === 0) {
      return res.status(404).json({ message: "Transaction not found." });
    }

    // Send the transaction details back in the response
    res.status(200).json(transaction);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function updateTransaction(req, res) {
  try {
    const transactionId = req.params.id;
    const accountId = req.user.id; // Ensure that req.user.id is populated correctly from authentication
    const { amount, date, description, cat } = req.body;

    if (!amount || !date || !description || !cat) {
      return res.status(400).json({ message: "All fields are required." });
    }

    let updatedTransaction = {
      amount: parseFloat(amount),
      date: date,
      description: description.trim(),
      cat: cat.trim()
    };

    const result = await financeModel.updateTransaction(accountId, transactionId, updatedTransaction);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error updating transaction:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function deleteTransaction(req, res) {
  try {
    const transactionId = req.params.id;
    const accountId = req.user.id; // Ensure that req.user.id is populated correctly from authentication

    const result = await financeModel.deleteTransaction(accountId, transactionId);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Transaction not found." });
    }

    res.status(200).json({ message: "Transaction deleted successfully." });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function getTransactionsByMonth(req, res) {
  try {
    const accountId = req.user.id;
    const month = req.params.month; // 'YYYY-MM'

    const { transactions } = await financeModel.getExpenditureForMonth(accountId, month);
    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching transactions by month:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function getTransportationBarChart(req, res) {
  try {
    const userId = req.user.id;
    const month = req.params.month;

    const spent = await financeModel.getTransportationExpenditure(userId, month) || 0;
    const goal = await financeModel.getTransportationGoal(userId, month) || 0;

    const spentAmount = parseFloat(spent);
    const goalAmount = parseFloat(goal);
    var spentPercentage = goalAmount > 0 ? (spentAmount / goalAmount * 100) : 0;
    var remainingPercentage = Math.max(0, 100 - spentPercentage);

    var rounded = 0;
    if (spentAmount >= goalAmount) {
      spentPercentage = 100;
      remainingPercentage = 0;
      rounded = 30;
    }

    const chartData = {
      type: 'bar',
      data: {
        labels: [''],
        datasets: [
          {
            data: [spentPercentage],
            backgroundColor: '#A0DDBD',
            stack: 'stack1',
            borderRadius: {
              topLeft: 30,
              bottomLeft: 30,
              topRight: rounded,
              bottomRight: rounded
            },
            borderSkipped: false
          },
          {
            data: [remainingPercentage],
            backgroundColor: '#e0e0e0',
            stack: 'stack1',
            borderRadius: {
              topLeft: spent == 0 || goal == 0 ? 30 : 0,
              bottomLeft: spent == 0 || goal == 0 ? 30 : 0,
              topRight: 30,
              bottomRight: 30
            },
            borderSkipped: false
          }
        ]

      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            min: 0,
            max: 100,
            grid: { display: false, drawTicks: false, drawBorder: false },
            ticks: { display: false }
          },
          y: {
            stacked: true,
            grid: { display: false, drawTicks: false, drawBorder: false },
            ticks: { display: false }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
          title: { display: false }
        }
      }
    };


    const chartUrl = 'https://quickchart.io/chart?width=500&height=50&version=4&c=' +
      encodeURIComponent(JSON.stringify(chartData));

    res.json({
      chartUrl,
      spent: spentAmount.toFixed(2),
      goal: goalAmount.toFixed(2) == 0 ? "No Goal Set" : goalAmount.toFixed(2),
      spentPercentage: spentPercentage.toFixed(2)
    });

  } catch (error) {
    console.error("Error generating transportation bar chart:", error);
    res.status(500).json({ message: "Failed to generate transportation bar chart" });
  }
}

async function getFoodBarChart(req, res) {
  try {
    const userId = req.user.id;
    const month = req.params.month;

    const spent = await financeModel.getFoodExpenditure(userId, month) || 0;
    const goal = await financeModel.getFoodGoal(userId, month) || 0;

    const spentAmount = parseFloat(spent);
    const goalAmount = parseFloat(goal);
    var spentPercentage = goalAmount > 0 ? (spentAmount / goalAmount * 100) : 0;
    var remainingPercentage = Math.max(0, 100 - spentPercentage);

    var rounded = 0;
    if (spentAmount >= goalAmount) {
      spentPercentage = 100;
      remainingPercentage = 0;
      rounded = 30;
    }

    const chartData = {
      type: 'bar',
      data: {
        labels: [''],
        datasets: [
          {
            data: [spentPercentage],
            backgroundColor: '#A0DDBD',
            stack: 'stack1',
            borderRadius: {
              topLeft: 30,
              bottomLeft: 30,
              topRight: rounded,
              bottomRight: rounded
            },
            borderSkipped: false
          },
          {
            data: [remainingPercentage],
            backgroundColor: '#e0e0e0',
            stack: 'stack1',
            borderRadius: {
              topLeft: spent == 0 || goal == 0 ? 30 : 0,
              bottomLeft: spent == 0 || goal == 0 ? 30 : 0,
              topRight: 30,
              bottomRight: 30
            },
            borderSkipped: false
          }
        ]

      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            min: 0,
            max: 100,
            grid: { display: false, drawTicks: false, drawBorder: false },
            ticks: { display: false }
          },
          y: {
            stacked: true,
            grid: { display: false, drawTicks: false, drawBorder: false },
            ticks: { display: false }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
          title: { display: false }
        }
      }
    };

    const chartUrl = 'https://quickchart.io/chart?width=500&height=50&version=4&c=' +
      encodeURIComponent(JSON.stringify(chartData));

    res.json({
      chartUrl,
      spent: spentAmount.toFixed(2),
      goal: goalAmount.toFixed(2) == 0 ? "No Goal Set" : goalAmount.toFixed(2),
      spentPercentage: spentPercentage.toFixed(2)
    });

  } catch (error) {
    console.error("Error generating transportation bar chart:", error);
    res.status(500).json({ message: "Failed to generate transportation bar chart" });
  }
}


async function getUtilityBarChart(req, res) {
  try {
    const userId = req.user.id;
    const month = req.params.month;

    const spent = await financeModel.getUtilityExpenditure(userId, month) || 0;
    const goal = await financeModel.getUtilityGoal(userId, month) || 0;

    const spentAmount = parseFloat(spent);
    const goalAmount = parseFloat(goal);
    var spentPercentage = goalAmount > 0 ? (spentAmount / goalAmount * 100) : 0;
    var remainingPercentage = Math.max(0, 100 - spentPercentage);

    var rounded = 0;
    if (spentAmount >= goalAmount) {
      spentPercentage = 100;
      remainingPercentage = 0;
      rounded = 30;
    }

    const chartData = {
      type: 'bar',
      data: {
        labels: [''],
        datasets: [
          {
            data: [spentPercentage],
            backgroundColor: '#A0DDBD',
            stack: 'stack1',
            borderRadius: {
              topLeft: 30,
              bottomLeft: 30,
              topRight: rounded,
              bottomRight: rounded
            },
            borderSkipped: false
          },
          {
            data: [remainingPercentage],
            backgroundColor: '#e0e0e0',
            stack: 'stack1',
            borderRadius: {
              topLeft: spent == 0 || goal == 0 ? 30 : 0,
              bottomLeft: spent == 0 || goal == 0 ? 30 : 0,
              topRight: 30,
              bottomRight: 30
            },
            borderSkipped: false
          }
        ]

      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            min: 0,
            max: 100,
            grid: { display: false, drawTicks: false, drawBorder: false },
            ticks: { display: false }
          },
          y: {
            stacked: true,
            grid: { display: false, drawTicks: false, drawBorder: false },
            ticks: { display: false }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
          title: { display: false }
        }
      }
    };


    const chartUrl = 'https://quickchart.io/chart?width=500&height=50&version=4&c=' +
      encodeURIComponent(JSON.stringify(chartData));

    res.json({
      chartUrl,
      spent: spentAmount.toFixed(2),
      goal: goalAmount.toFixed(2) == 0 ? "No Goal Set" : goalAmount.toFixed(2),
      spentPercentage: spentPercentage.toFixed(2)
    });

  } catch (error) {
    console.error("Error generating utilities bar chart:", error);
    res.status(500).json({ message: "Failed to generate utilities bar chart" });
  }
}

async function getOtherBarChart(req, res) {
  try {
    const userId = req.user.id;
    const month = req.params.month;

    const spent = await financeModel.getOtherExpenditure(userId, month) || 0;
    const goal = await financeModel.getOtherGoal(userId, month) || 0;

    const spentAmount = parseFloat(spent);
    const goalAmount = parseFloat(goal);
    var spentPercentage = goalAmount > 0 ? (spentAmount / goalAmount * 100) : 0;
    var remainingPercentage = Math.max(0, 100 - spentPercentage);

    var rounded = 0;
    if (spentAmount >= goalAmount) {
      spentPercentage = 100;
      remainingPercentage = 0;
      rounded = 30;
    }

    const chartData = {
      type: 'bar',
      data: {
        labels: [''],
        datasets: [
          {
            data: [spentPercentage],
            backgroundColor: '#A0DDBD',
            stack: 'stack1',
            borderRadius: {
              topLeft: 30,
              bottomLeft: 30,
              topRight: rounded,
              bottomRight: rounded
            },
            borderSkipped: false
          },
          {
            data: [remainingPercentage],
            backgroundColor: '#e0e0e0',
            stack: 'stack1',
            borderRadius: {
              topLeft: spent == 0 || goal == 0 ? 30 : 0,
              bottomLeft: spent == 0 || goal == 0 ? 30 : 0,
              topRight: 30,
              bottomRight: 30
            },
            borderSkipped: false
          }
        ]

      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            min: 0,
            max: 100,
            grid: { display: false, drawTicks: false, drawBorder: false },
            ticks: { display: false }
          },
          y: {
            stacked: true,
            grid: { display: false, drawTicks: false, drawBorder: false },
            ticks: { display: false }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
          title: { display: false }
        }
      }
    };


    const chartUrl = 'https://quickchart.io/chart?width=500&height=50&version=4&c=' +
      encodeURIComponent(JSON.stringify(chartData));

    res.json({
      chartUrl,
      spent: spentAmount.toFixed(2),
      goal: goalAmount.toFixed(2) == 0 ? "No Goal Set" : goalAmount.toFixed(2),
      spentPercentage: spentPercentage.toFixed(2)
    });

  } catch (error) {
    console.error("Error generating utilities bar chart:", error);
    res.status(500).json({ message: "Failed to generate utilities bar chart" });
  }
}
module.exports = {
  getTransactionsByMonth,
  getExpenditureGoalByID,
  getTotalExpenditureByID,
  getMonthlyExpenditureByID,
  getExpenditureByMonthBarChart,
  getAllTransactionsByID,
  getBudgetExpenditureDoughnutChart,
  addTransactionToAccount,
  updateExpenditureGoal,
  getTransactionByID,
  updateTransaction,
  deleteTransaction,
  getTransportationBarChart,
  getFoodBarChart,
  getUtilityBarChart,
  getExpenditureGoalPerCategoryMonth,
  getOtherBarChart
};